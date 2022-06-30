/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

const db = require('../persist/db');
const CmdService = require('./impinj/rest-cmd-service');
const ImpinjStatus = require('./impinj/status');
const ImpinjEvent = require('./impinj/event');
const Behavior = require('../behaviors/behavior');
const AntennaPorts = require('./antenna-ports');
const RunState = require('./run-state');
const {cloneDeep} = require('lodash');
const Mutex = require('async-mutex').Mutex;
const mutex = new Mutex();
const cachedSensors = new Map;
const logger = require('../logger')('sensor');

async function updateCache() {
  const release = await mutex.acquire();
  try {
    cachedSensors.clear();
    const sensors = await db.sensors.findAll();
    for (const sensor of sensors) {
      cachedSensors.set(sensor.deviceId, sensor);
    }
    logger.info(`updated cache with sensor count ${cachedSensors.size}`);
  } catch (err) {
    logger.error(`updating cache : ${err.toString()}`);
  } finally {
    release();
  }
}

async function persistCache() {
  const release = await mutex.acquire();
  try {
    const promises = [];
    for (const sensor of cachedSensors.values()) {
      promises.push(sensor.save());
    }
    await Promise.all(promises);
    logger.info(`persisted cache with sensor count ${cachedSensors.size}`);
  } catch (err) {
    logger.error(`persisting cache : ${err.toString()}`);
  } finally {
    release();
  }
}

async function onConnect(hostname, ip4Address) {
  const release = await mutex.acquire();
  let sensor = cachedSensors.get(hostname);
  try {
    if (!sensor) {
      sensor = await db.sensors.create({
        deviceId: hostname,
        ip4Address: ip4Address,
        behaviorId: '',
        antennaPorts: AntennaPorts.getDefault(),
        status: ImpinjStatus.Values.UNKNOWN,
        connected: true,
      });
      cachedSensors.set(sensor.deviceId, sensor);
      logger.info(`${sensor.deviceId} : ${sensor.ip4Address} connected NEW DEVICE`);
    } else {
      if (sensor.ip4Address !== ip4Address || !sensor.connected) {
        sensor.ip4Address = ip4Address;
        sensor.connected = true;
        await sensor.save();
      }
      logger.info(`${sensor.deviceId} : ${sensor.ip4Address} connected EXISTING DEVICE`);
    }
  } catch (err) {
    logger.error(`${hostname} : ${ip4Address} ERROR on connection : ${err.toString()}`);
  } finally {
    release();
  }
  return sensor;
}

async function onDisconnect(deviceId) {
  const release = await mutex.acquire();
  try {
    const sensor = cachedSensors.get(deviceId);
    if (sensor) {
      sensor.connected = false;
      sensor.satus = ImpinjStatus.Values.UNKNOWN;
      await sensor.save();
      logger.info(`${deviceId} disconnected`);
    } else {
      logger.error(`${deviceId} received disconnect message from unknown device`);
    }
  } catch (err) {
    logger.error(`${deviceId} ERROR disconnecting : ${err.toString()}`);
  } finally {
    release();
  }
}

async function onInventoryStatusEvent(deviceId, ise) {
  try {
    const sensor = await getOne(deviceId);
    if (sensor === null) {
      return;
    }
    let shouldSave = false;
    switch (ise.inventoryStatus) {
      case ImpinjEvent.InventoryStatusValues.IDLE:
        if (sensor.status !== ImpinjStatus.Values.IDLE) {
          sensor.status = ImpinjStatus.Values.IDLE;
          shouldSave = true;
        }
        break;
      case ImpinjEvent.InventoryStatusValues.RUNNING:
        if (sensor.status !== ImpinjStatus.Values.RUNNING) {
          sensor.status = ImpinjStatus.Values.RUNNING;
          shouldSave = true;
        }
        break;
    }
    if (shouldSave) {
      sensor.save();
    }
  } catch (err) {
    logger.error(`${deviceId} ERROR handling InventoryStatusEvent : ${err.toString()}`);
  }
}

async function synchronizeStatus(sensor, curRunState) {
  if (sensor.ip4Address === 'unknown') {
    return;
  }
  let rsp;
  let update = false;
  let shouldStop = false;
  let shouldStart = false;
  try {
    rsp = await CmdService.getStatus(sensor.ip4Address);
  } catch (err) {
    if (err.message.includes('timeout') && err.message.includes('exceed')) {
      return;
    }
    logger.error(`${sensor.deviceId} synchronizing status : ${err.toString()}`);
    return;
  }
  const release = await mutex.acquire();
  try {
    if (rsp.data) {
      if (sensor.connected === false) {
        sensor.connected = true;
        update = true;
      }
      // running and it shouldn't be
      if (rsp.data.status === ImpinjStatus.Values.RUNNING && curRunState === RunState.INACTIVE) {
        shouldStop = true;
      }
      // not running and it should
      if (rsp.data.status !== ImpinjStatus.Values.RUNNING && curRunState === RunState.ACTIVE) {
        shouldStart = true;
      }
      // running and it should but wrong behavior
      if (rsp.data.status === ImpinjStatus.Values.RUNNING &&
        curRunState === RunState.ACTIVE &&
        rsp.data.activePreset.id !== sensor.behaviorId) {
        shouldStart = true;
      }
      if (rsp.data.status !== sensor.status) {
        sensor.status = rsp.data.status;
        update = true;
      }
    } else {
      if (sensor.connected === true) {
        sensor.connected = false;
        sensor.status = ImpinjStatus.Values.UNKNOWN;
        update = true;
      }
    }
    if (update) {
      await sensor.save();
    }
  } catch (err) {
    logger.error(`${sensor.deviceId} ERROR synchronizing status : ${err.toString()}`);
    shouldStop = false;
    shouldStart = false;
  } finally {
    release();
  }
  if (shouldStop) {
    await stop(sensor);
  }
  if (shouldStart) {
    await start(sensor);
  }
}

async function configureMqtt(sensor, impinjMqttCfg) {
  let status;
  try {
    const rsp = await CmdService.putMqttSettings(sensor.ip4Address, impinjMqttCfg);
    if (rsp.status >= 200 && rsp.status < 300) {
      logger.info(`configured mqtt on ${sensor.deviceId} with ` +
        `url: ${impinjMqttCfg.brokerHostname}:${impinjMqttCfg.brokerPort} ` +
        `topics: ${impinjMqttCfg.eventTopic}, ${impinjMqttCfg.willTopic}`);
      status = 'OK configured mqtt';
    } else {
      status = `ERROR configuring mqtt settings for ${sensor.deviceId} ` +
        `rsp:${rsp.status}-${rsp.statusText}`;
      logger.error(`${sensor.deviceId} ${status}`);
    }
  } catch (err) {
    status = `ERROR configuring mqtt settings for ${sensor.deviceId} ${err.message}`;
    logger.error(`${sensor.deviceId} ERROR configuring mqtt : ${err.toString()}`);
  }
  return status;
}

async function start(sensor) {
  let status;
  // check basics
  if (!sensor.connected) {
    status = `ERROR starting ${sensor.deviceId} ` +
      'not connected';
  } else if (sensor.status === ImpinjStatus.Values.RUNNING) {
    status = `ERROR starting ${sensor.deviceId} ` +
      'already running';
  } else if (!sensor.antennaPorts || sensor.antennaPorts.length === 0) {
    status = `ERROR starting ${sensor.deviceId} ` +
      'no antenna ports defined';
  } else if (!sensor.behaviorId) {
    status = `ERROR starting ${sensor.deviceId} ` +
      'no behavior configured on the sensor';
  }
  if (status) {
    logger.error(`${sensor.deviceId} ERROR : ${status}`);
    return status;
  }

  // check behavior including antennae
  const behavior = Behavior.getOne(sensor.behaviorId);
  if (!behavior) {
    status = `ERROR starting ${sensor.deviceId} ` +
      `the behavior ${sensor.behaviorId} is not installed on the controller`;
    logger.error(`${sensor.deviceId} ${status}`);
    return status;
  }
  for (const bAntCfg of behavior.preset.antennaConfigs) {
    let found = false;
    for (const sAntPort of sensor.antennaPorts) {
      if (bAntCfg.antennaPort === sAntPort.antennaPort) {
        found = true;
        break;
      }
    }
    if (!found) {
      status = `ERROR starting ${sensor.deviceId} ` +
        `behavior ${sensor.behaviorId} antenna port ${bAntCfg.antennaPort} ` +
        'is not configured on sensor';
      logger.error(`${sensor.deviceId} ${status}`);
      return status;
    }
  }

  let rsp;
  rsp = await CmdService.putPreset(sensor.ip4Address, sensor.behaviorId, behavior.preset);
  if (rsp.status >= 200 && rsp.status < 300) {
    logger.debug(`${sensor.deviceId} putPreset ${sensor.behaviorId}  rsp:${rsp.status}:OK`);
  } else {
    status = `ERROR starting ${sensor.deviceId} ` +
      `failed putting behavior ${sensor.behaviorId} ` +
      `rsp:${rsp.status}-${rsp.statusText}`;
    logger.error(`${sensor.deviceId} ${status}`);
    return status;
  }
  const release = await mutex.acquire();
  try {
    rsp = await CmdService.startPreset(sensor.ip4Address, sensor.behaviorId);
    if (rsp.status >= 200 && rsp.status < 300) {
      logger.debug(`${sensor.deviceId} startPreset ${sensor.behaviorId}  rsp:${rsp.status}:OK`);
      sensor.status = ImpinjStatus.Values.RUNNING;
      await sensor.save();
      status = 'OK started';
      logger.info(`${sensor.deviceId} started - ${sensor.status}`);
    } else {
      status = `ERROR starting ${sensor.deviceId} ` +
        `failed posting behavior ${sensor.behaviorId} ` +
        `rsp:${rsp.status}-${rsp.statusText}`;
      logger.error(`${sensor.deviceId} ${status}`);
    }
  } catch (err) {
    status = `ERROR starting ${sensor.deviceId} ${err.message}`;
    logger.error(`${sensor.deviceId} ERROR starting : ${err.toString()}`);
  } finally {
    release();
  }
  return status;
}

async function stop(sensor) {
  let status;
  const release = await mutex.acquire();
  try {
    const rsp = await CmdService.stopPreset(sensor.ip4Address);
    if (rsp.status >= 200 && rsp.status < 300) {
      sensor.status = ImpinjStatus.Values.IDLE;
      await sensor.save();
      status = 'OK stopped';
      logger.info(`${sensor.deviceId} stopped`);
    } else {
      status = `ERROR stopping ${sensor.deviceId}: ` +
        `rsp:${rsp.status}-${rsp.statusText}`;
      logger.error(`${sensor.deviceId} ${status}`);
    }
  } catch (err) {
    status = `ERROR stopping sensor ${sensor.deviceId} ${err.message}`;
    logger.error(`${sensor.deviceId} ERROR stopping : ${err.toString()}`);
  } finally {
    release();
  }
  return status;
}

async function reboot(sensor) {
  let status;
  const release = await mutex.acquire();
  try {
    const rsp = await CmdService.postReboot(sensor.ip4Address);
    if (rsp.status >= 200 && rsp.status < 300) {
      sensor.status = ImpinjStatus.Values.UNKNOWN;
      sensor.connected = false;
      await sensor.save();
      status = 'OK rebooted';
      logger.info(`${sensor.deviceId} rebooted`);
    } else {
      status = `ERROR rebooting ${sensor.deviceId}: ` +
        `rsp:${rsp.status}-${rsp.statusText}`;
      logger.error(`${sensor.deviceId} ${status}`);
    }
  } catch (err) {
    status = `ERROR rebooting ${sensor.deviceId} ${err.message}`;
    logger.error(`${sensor.deviceId} ERROR rebooting : ${err.toString()}`);
  } finally {
    release();
  }
  return status;
}

async function commandAll(cmd) {
  const sensors = await getAll();
  let sensor;
  const statuses = [];
  for (sensor of sensors) {
    const curStatus = { deviceId: sensor.deviceId, status: ''};
    statuses.push(curStatus);
    if (!sensor.connected) {
      curStatus.status = `INFO ${sensor.deviceId} is not connected - ${cmd} command not sent`;
      logger.debug(`${sensor.deviceId} ${curStatus.status}`);
      continue;
    }
    switch (cmd) {
      case 'start':
        curStatus.status = await start(sensor);
        break;
      case 'stop':
        curStatus.status = await stop(sensor);
        break;
      case 'reboot':
        curStatus.status = await reboot(sensor);
        break;
    }
  }
  return statuses;
}

async function getAll() {
  return Array.from(cachedSensors.values());
}

async function getOne(deviceId) {
  return cachedSensors.get(deviceId);
}

async function upsertOne(params) {
  const release = await mutex.acquire();
  try {
    let sensor = cachedSensors.get(params.deviceId);
    if (!sensor) {
      sensor = await db.sensors.create({
        deviceId: params.deviceId,
        behaviorId: params.behaviorId,
        antennaPorts: cloneDeep(params.antennaPorts),
        status: ImpinjStatus.Values.UNKNOWN,
        connected: false,
      });
      cachedSensors.set(sensor.deviceId, sensor);
      logger.info(`${sensor.deviceId} CREATED`);
    } else {
      sensor.behaviorId = params.behaviorId;
      sensor.antennaPorts = cloneDeep(params.antennaPorts);
      await sensor.save();
      logger.info(`${sensor.deviceId} UPDATED`);
    }
    return sensor;
    // NOTE!!
    // Specifically do not catch exceptions here
    // they are used by the controller to determine success failure
    // for the response
  } finally {
    release();
  }
}

async function deleteOne(deviceId) {
  let sensor;
  const release = await mutex.acquire();
  try {
    sensor = cachedSensors.get(deviceId);
    if (sensor) {
      await db.sensors.destroy({where: {deviceId: deviceId}});
      cachedSensors.delete(deviceId);
      logger.info(`${sensor.deviceId} DELETED`);
    } else {
      logger.info(`${sensor.deviceId} unable to delete UNKNOWN device id`);
    }
    // NOTE!!
    // Specifically do not catch exceptions here
    // they are used by the controller to determine success failure
    // for the response
  } finally {
    release();
  }
  return sensor;
}

module.exports = {
  getAll,
  getOne,
  upsertOne,
  deleteOne,
  updateCache,
  persistCache,
  onConnect,
  onDisconnect,
  onInventoryStatusEvent,
  commandAll,
  configureMqtt,
  synchronizeStatus,
  start,
  stop,
  reboot,
};
