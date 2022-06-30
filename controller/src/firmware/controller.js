/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

const CmdService = require('../sensors/impinj/rest-cmd-service');
const formidable = require('formidable');
const db = require('../persist/db');
const fs = require('fs');
const logger = require('../logger')('firmware-controller');

const firmwareDir = process.env.DIR_FIRMWARE || './run/firmware';
if (!fs.existsSync(firmwareDir)) {
  fs.mkdirSync(firmwareDir, {recursive: true});
  logger.info(`created ${firmwareDir}`);
}

function returnError500(deviceId, res, err) {
  logger.error(err.toString());
  let msg;
  if (err.response) {
    msg = `device ${deviceId} ` +
      `returned status ${err.response.status} ${err.response.statusText}`;
  } else {
    msg = err.message;
  }
  return res.status(500).json({message: msg});
}

async function getImages(req, res) {
  try {
    const fileStats = [];
    const filenames = fs.readdirSync(firmwareDir);
    for (const fname of filenames) {
      const stats = fs.statSync(`${firmwareDir}/${fname}`);
      fileStats.push({
        name: fname,
        size: stats.size,
        mtime: stats.mtime,
      });
    }
    return res.status(200).json(fileStats);
  } catch (err) {
    returnError500(null, res, err);
  }
}

async function postImage(req, res) {
  try {
    let finalPath = '';
    let fileNameUploaded = '';
    const form = new formidable.IncomingForm({});
    form.parse(req);
    form.on('fileBegin', function (name, file) {
      file.path = `${firmwareDir}/${file.name}`;
      finalPath = file.path;
    });
    form.on('file', function (name, file) {
      logger.info(`image uploaded ${file.name}`);
      fileNameUploaded = file.name;
    });
    form.on('end', function () {
      return res.status(202).json({filename: fileNameUploaded});
    });
    form.on('error', function (err) {
      logger.error(`posting image : ${err.message}`);
      try {
        if (finalPath) {
          fs.unlinkSync(finalPath);
        }
      } catch (err) {
        logger.error(`deleting file uploaded with errors : ${err.message}`);
      }
      return res.status(400).json({message: err.message});
    });
  } catch (err) {
    returnError500(null, res, err);
  }
}

async function deleteImage(req, res) {
  if (!(req.body.filename)) {
    return res.status(400).json({message: 'missing required fields: filename'});
  }
  const filePath = `${firmwareDir}/${req.body.filename}`;
  if (!fs.existsSync(filePath)) {
    return res.status(400).json({message: `unkown firmware file: ${req.body.filename}`});
  }
  try {
    fs.unlinkSync(filePath);
    logger.info(`deleted image ${filePath}`);
    return res.status(200).json({filename: req.body.filename});
  } catch (err) {
    returnError500(null, res, err);
  }
}

async function getSensorsInfo(req, res) {
  try {
    const infos = [];
    const sensors = await db.sensors.findAll({where: {connected: true,}});
    for (const sensor of sensors) {
      try {
        const resp = await CmdService.getFirmwareInfo(sensor.ip4Address);
        if (resp.data) {
          resp.data['deviceId'] = sensor.deviceId;
          infos.push(resp.data);
        }
      } catch (err) {
        returnError500(sensor.deviceId, res, err);
        return;
      }
    }
    return res.status(200).json(infos);
  } catch (err) {
    returnError500(null, res, err);
  }
}

async function postSensorsUpgrade(req, res) {

  if (!(req.body.filename) || !(req.body.deviceIds)) {
    return res.status(400).json({message: 'missing required fields: filename, deviceIds'});
  }
  const filePath = `${firmwareDir}/${req.body.filename}`;
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({message: `unkown firmware file: ${req.body.filename}`});
  }
  try {
    const whereClause = {
      connected: true,
      deviceId: req.body.deviceIds,
    };
    const sensors = await db.sensors.findAll({where: whereClause});
    if (sensors.length <= 0) {
      const msg = {message: 'no connected sensors found for the provided deviceIds'};
      return res.status(404).json(msg);
    }
    const deviceIds = [];
    for (const sensor of sensors) {
      try {
        CmdService.postFirmwareUpgrade(sensor.ip4Address, filePath);
        deviceIds.push(sensor.deviceId);
        logger.info(`posted upgrade : ${sensor.deviceId} : ${sensor.ip4Address}`);
      } catch (err) {
        logger.error(`posting upgrade : ${sensor.deviceId} : ${sensor.ip4Address} ${err}`);
      }
    }
    return res.status(202).json(deviceIds);
  } catch (err) {
    returnError500(null, res, err);
  }
}

async function getSensorsUpgrade(req, res) {
  try {
    const whereClause = {
      connected: true
    };
    if (req.body.deviceIds) {
      whereClause['deviceIds'] = req.body.deviceIds;
    }
    const sensors = await db.sensors.findAll({where: whereClause});
    const statuses = [];
    for (const sensor of sensors) {
      try {
        const sensorRes = await CmdService.getUpgradeStatus(sensor.ip4Address);
        if (sensorRes.data) {
          sensorRes.data['deviceId'] = sensor.deviceId;
          statuses.push(sensorRes.data);
        }
      } catch (err) {
        returnError500(sensor.deviceId, res, err);
        return;
      }
    }
    return res.status(200).json(statuses);
  } catch (err) {
    returnError500(null, res, err);
  }
}

module.exports = {
  getImages,
  postImage,
  deleteImage,
  getSensorsInfo,
  getSensorsUpgrade,
  postSensorsUpgrade
};
