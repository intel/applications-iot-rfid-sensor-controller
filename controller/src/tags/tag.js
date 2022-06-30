/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

const db = require('../persist/db');
const Sensor = require('../sensors/sensor');
const Personality = require('../sensors/personality');
const Location = require('./location');
const TagState = require('./state');
const InventoryEvent = require('../events/inventory');
const EventCfg = require('../events/config');
const MqttConfig = require('../mqtt/config');
const MqttService = require('../mqtt/service');
const Mutex = require('async-mutex').Mutex;
const mutex = new Mutex();
const logger = require('../logger')('tag');

const cachedReadStats = new Map;
const cachedTags = new Map;

function addReadStatToCache(readStat) {
  let epcMap = cachedReadStats.get(readStat.epc);
  if (!epcMap) {
    epcMap = new Map;
    cachedReadStats.set(readStat.epc, epcMap);
  }
  let devMap = epcMap.get(readStat.deviceId);
  if (!devMap) {
    devMap = new Map;
    epcMap.set(readStat.deviceId, devMap);
  }
  devMap.set(readStat.antennaPort, readStat);
}

function getReadStatFromCache(epc, deviceId, antennaPort) {
  const epcMap = cachedReadStats.get(epc);
  if (!epcMap) {
    return null;
  }
  const devMap = epcMap.get(deviceId);
  if (!devMap) {
    return null;
  }
  return devMap.get(antennaPort);
}

async function updateCache() {
  const release = await mutex.acquire();
  try {
    await unguardedUpdateCache();
  } finally {
    release();
  }
}

async function unguardedUpdateCache() {
  cachedReadStats.clear();
  const readStats = await db.tagStats.findAll()
    .catch(err => {
      logger.error(`${err}`);
    });
  for (const stat of readStats) {
    addReadStatToCache(stat);
  }
  cachedTags.clear();
  const tags = await db.tags.findAll()
    .catch(err => {
      logger.error(`${err}`);
    });
  for (const tag of tags) {
    cachedTags.set(tag.epc, tag);
  }
  logger.info(`caches updated with ReadStats[${cachedReadStats.size}] Tags[${cachedTags.size}]`);
}

async function persistCache() {
  const release = await mutex.acquire();
  try {
    let promises = [];
    for (const epcMap of cachedReadStats.values()) {
      for (const devMap of epcMap.values()) {
        for (const readStat of devMap.values()) {
          promises.push(
            readStat
              .save()
              .catch(err => {
                logger.error(`persisting tag stat : ${err.message}`);
              })
          );
        }
      }
    }
    await Promise.all(promises);

    promises = [];
    for (const tag of cachedTags.values()) {
      promises.push(tag.save().catch(err => {
        logger.error(`persisting tag : ${err.message}`);
      })
      );
    }
    await Promise.all(promises);
    logger.info('caches persisted with ' +
      `ReadStats[${cachedReadStats.size}] ` +
      `Tags[${cachedTags.size}]`);
  } catch (err) {
    logger.error(`persisting cache : ${err}`);
  } finally {
    release();
  }
}

async function onTagInventoryEvent(deviceId, tie) {
  const release = await mutex.acquire();
  try {
    const sensor = await Sensor.getOne(deviceId);
    // don't process tags from any sensor we don't know about
    if (!sensor) {
      return;
    }
    const now = new Date();
    const nowTimeStamp = now.toISOString();
    const readLoc = Location.getDefault(
      deviceId,
      tie.antennaPort,
      sensor.getAntennaName(tie.antennaPort)
    );

    let stat = getReadStatFromCache(tie.epcHex, deviceId, tie.antennaPort);
    if (!stat) {
      // CREATE
      stat = db.tagStats.build(
        {
          epc: tie.epcHex,
          deviceId: deviceId,
          antennaPort: tie.antennaPort,
          lastRead: nowTimeStamp,
          interval: 0,
          meanRssi: tie.peakRssiCdbm,
          numReads: 1,
        }
      );
      addReadStatToCache(stat);
    } else {
      // UPDATE
      stat.lastRead = nowTimeStamp;
      stat.meanRssi = (stat.meanRssi * stat.numReads) + tie.peakRssiCdbm;
      stat.numReads += 1;
      stat.meanRssi = Math.floor(stat.meanRssi / stat.numReads);
      stat.interval = Math.abs(Date.parse(tie.lastSeenTime) - Date.parse(stat.lastRead));
    }

    // location is not part of the model
    // adding it here for use in subsequent algorithms
    stat.location = readLoc;

    let tag = cachedTags.get(tie.epcHex);
    if (!tag) {
      // CREATE
      // needed to use upsert here because the delete/destroy
      // call on sequelize doesn't seem to actually remove the
      // tag ... which was causing unique constraint errrors
      [tag] = await db.tags
        .upsert({
          epc: tie.epcHex,
          tid: tie.tidHex,
          state: TagState.PRESENT,
          lastArrived: nowTimeStamp,
          lastRead: nowTimeStamp,
          location: readLoc,
          facilityId: sensor.getFacilityId(tie.antennaPort),
        })
        .catch(err => {
          logger.error(`${err}`);
        });
      if (!tag) {
        logger.error(`creating tag in database : ${tie.epcHex}`);
        return;
      }
      tag.lastPersist = now;
      cachedTags.set(tag.epc, tag);
    } else {
      //  UPDATE
      tag.lastRead = nowTimeStamp;
      // In case we didn't read TID the first time
      if ((tag.tid === null) && (tie.tidHex)) {
        tag.tid = tie.tidHex;
      }
      switch (tag.state) {
        case TagState.PRESENT:
        case TagState.EXITING:
          checkForDepartedPOS(sensor, tag, stat);
          if (tag.state !== TagState.DEPARTED_POS) {
            checkForMovementOrExiting(sensor, tag, stat);
          }
          break;
        case TagState.DEPARTED_EXIT:
        case TagState.DEPARTED_POS:
          checkForReturn(sensor, tag, stat);
          break;
      }
    }

    const uie = buildUpstreamEvent(tag);
    if (uie !== null) {
      MqttService.publish(MqttConfig.Topic.events, uie);

    }
    // some state on the tag has changed if an event is published
    // so be sure and persist.
    if (!tag.lastPersist || now - tag.lastPersist > 2000) {
      tag.lastPersist = now;
      tag.save()
        .then((ignored, err) => {
          if (err) {
            logger.error(`tag save ERROR: ${err}`);
          }
        })
        .catch(err => {
          logger.error(`saving : ${err}`);
        });
    }
  } catch (err) {
    logger.error(`handling TagInventoryEvent : ${err}`);
  } finally {
    release();
  }
}

function checkForDepartedPOS(sensor, tag, curReadStat) {
  if (sensor.getPersonality(curReadStat.location.antennaPort) === Personality.POS) {
    if (tag.state !== TagState.DEPARTED_POS) {
      tag.lastDeparted = curReadStat.lastRead;
      tag.state = TagState.DEPARTED_POS;
      tag.location = curReadStat.location;
      tag.facilityId = sensor.getFacilityId(curReadStat.location.antennaPort);
      tag.lastPersist = 0;
    }
  }
}

function checkForMovementOrExiting(sensor, tag, curReadStat) {
  // need to check if this read is from an exit
  const personality = sensor.getPersonality(curReadStat.location.antennaPort);
  if (tag.location.deviceId === curReadStat.location.deviceId &&
    tag.location.antennaPort === curReadStat.location.antennaPort) {
    // handle the situation where a tag is initially (or only)
    // read by an exit antenna
    if (personality === Personality.EXIT) {
      tag.state = TagState.EXITING;
      tag.lastPersist = 0;
    }
    return;
  }

  const curLocationStat = getReadStatFromCache(
    tag.epc,
    tag.location.deviceId,
    tag.location.antennaPort);
  if (!curLocationStat) {
    return;
  }

  // Using the current mobility profile, age the value of the current location
  // and compare it to the meanRssi of the last read location
  const w = EventCfg.getRssiAdjustment(curReadStat.lastRead, curLocationStat.lastRead);
  if (curReadStat.meanRssi > curLocationStat.meanRssi + w) {
    tag.lastMoved = curReadStat.lastRead;
    tag.location = curReadStat.location;
    tag.facilityId = sensor.getFacilityId(curReadStat.location.antennaPort);
    if (personality === Personality.EXIT) {
      tag.state = TagState.EXITING;
    } else {
      tag.state = TagState.PRESENT;
    }
    tag.lastPersist = 0;
  }
}

function checkForReturn(sensor, tag, curReadStat) {
  let returned = false;
  // Tags can come back right away from DEPARTED_EXIT
  if (tag.state === TagState.DEPARTED_EXIT) {
    returned = true;
  } else if (tag.state === TagState.DEPARTED_POS) {
    const dateRead = Date.parse(curReadStat.lastRead);
    const dateDeparted = Date.parse(tag.lastDeparted);
    const timeSinceDeparted = Math.abs(dateRead - dateDeparted);
    if (timeSinceDeparted > EventCfg.getPosReturnHoldoff()) {
      returned = true;
    }
  }
  if (returned) {
    tag.state = TagState.PRESENT;
    tag.lastArrived = curReadStat.lastRead;
    tag.location = curReadStat.location;
    tag.facilityId = sensor.getFacilityId(curReadStat.location.antennaPort);
    tag.lastPersist = 0;
  }
}

function buildUpstreamEvent(tag) {
  let uie = null;
  let type = null;

  if (tag.lastArrived === tag.lastRead) {
    type = InventoryEvent.Type.ARRIVAL;
  } else if (tag.lastDeparted === tag.lastRead) {
    type = InventoryEvent.Type.DEPARTED;
  } else if (tag.lastMoved === tag.lastRead) {
    type = InventoryEvent.Type.MOVED;
  }
  if (type !== null) {
    uie = InventoryEvent.getEvent((new Date()).toISOString(), process.env.MQTT_CLIENT_TAG);
    uie.items.push(
      InventoryEvent.getEventItem(
        tag.facilityId,
        tag.epc,
        tag.tid,
        type,
        tag.lastRead,
        tag.location)
    );
  }
  return uie;
}

async function checkForDepartedExit() {
  const release = await mutex.acquire();
  try {
    let timeSinceLastRead;
    const departedEpcs = [];
    let uie = null;
    const now = new Date();
    const nowTimeStamp = now.toISOString();
    for (const tag of cachedTags.values()) {
      if (tag.state !== TagState.EXITING) {
        continue;
      }
      timeSinceLastRead = now - Date.parse(tag.lastRead);
      if (timeSinceLastRead > EventCfg.getExitTimeout()) {
        tag.state = TagState.DEPARTED_EXIT;
        tag.lastDeparted = nowTimeStamp;
        departedEpcs.push(tag.epc);
        if (!uie) {
          uie = InventoryEvent.getEvent(nowTimeStamp, process.env.MQTT_CLIENT_TAG);
        }
        uie.items.push(
          InventoryEvent.getEventItem(
            tag.facilityId,
            tag.epc,
            tag.tid,
            InventoryEvent.Type.DEPARTED,
            tag.lastRead,
            tag.location)
        );
      }
    }
    if (uie) {
      MqttService.publish(MqttConfig.Topic.events, uie);
    }
    if (departedEpcs.length > 0) {
      db.tags
        .update({
          lastDeparted: nowTimeStamp,
          state: TagState.DEPARTED_EXIT
        },
        {where: {epc: departedEpcs}})
        .catch(err => {
          logger.error(`updating depared tags : ${err}`);
        });
    }
  } catch (err) {
    logger.error(`checking for departed EXIT : ${err}`);
  } finally {
    release();
  }
}

async function createBulk(tags) {
  const created = [];
  const failed = [];
  const release = await mutex.acquire();
  try {
    for (const tag of tags) {
      try {
        const newTag = await db.tags.create(tag).catch(err => {
          logger.error(`updating depared tags : ${err}`);
        });
        created.push(newTag.epc);
        cachedTags.set(newTag.epc, newTag);
      } catch (err) {
        logger.error(`creating tag ${tag.epc} : ${err.toString}`);
        failed.push(err.message);
      }
    }
    await unguardedUpdateCache();
  } finally {
    release();
  }
  return [created, failed];
}

async function getAll(queryParams) {
  return db.tags.findAndCountAll(queryParams).catch(err => {
    logger.error(`${err}`);
  });
}

async function getOne(epc) {
  return db.tags.findByPk(epc).catch(err => {
    logger.error(`${err}`);
  });
}

async function deleteOne(epc) {
  const release = await mutex.acquire();
  try {
    const tagsCount = await db.tags
      .destroy({where: {epc: epc}})
      .catch(err => {
        logger.error(`deleteOne : ${err}`);
      });
    await db.tagStats
      .destroy({where: {epc: epc}})
      .catch(err => {
        logger.error(`deleteOne : ${err}`);
      });
    cachedReadStats.delete(epc);
    delete cachedTags.delete(epc);
    return tagsCount;
  } finally {
    release();
  }
}

async function deleteBulk(epcs) {
  const release = await mutex.acquire();
  try {
    const options = {where: {}};
    if (epcs && Array.isArray(epcs)) {
      options.where = {epc: epcs};
    }
    const deletedCount = await db.tags
      .destroy(options)
      .catch(err => {
        logger.error(`bulk delete tags : ${err}`);
      });
    await db.tagStats
      .destroy(options)
      .catch(err => {
        logger.error(`bulk delete tag stats : ${err}`);
      });
    await unguardedUpdateCache();
    logger.info(`bulk delete count ${deletedCount}`);
    return deletedCount;
  } finally {
    release();
  }
}

async function getStats(epc) {
  return db.tagStats
    .findAll({where: {epc: epc}})
    .catch(err => {
      logger.error(`delete bulk : ${err}`);
    });
}

module.exports = {
  createBulk,
  getAll,
  getOne,
  getStats,
  deleteBulk,
  deleteOne,
  updateCache,
  persistCache,
  onTagInventoryEvent,
  checkForDepartedExit,
};

