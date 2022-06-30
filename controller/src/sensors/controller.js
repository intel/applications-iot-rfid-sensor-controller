/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

const Sensor = require('./sensor');
const Service = require('./service');
const RunState = require('./run-state');
const logger = require('../logger')('sensor-controller');

async function getAll(req, res) {
  try {
    const sensors = await Sensor.getAll();
    return res.status(200).json(sensors);
  } catch (err) {
    logger.error(`getting all : ${err.toString()}`);
    return res.status(500).json({message: err.message});
  }
}

async function getOne(req, res) {
  try {
    const sensor = await Sensor.getOne(req.params.deviceId);
    return res.status(200).json(sensor);
  } catch (err) {
    logger.error(`getting one : ${err.toString()}`);
    return res.status(500).json({message: err.message});
  }
}

async function upsertBulk(req, res) {
  try {
    const rsp = {
      sensors: [],
      stopMessages: [],
      startMessages: [],
    };
    let msg;
    for (const sensor of req.body) {
      await Sensor.upsertOne(sensor);
      rsp.sensors.push(sensor);
      if (sensor.connected) {
        // Stop any reading that might be in progress with old config
        msg = await Sensor.stop(rsp.sensor);
        if (msg) {
          rsp.stopMessages.push(msg);
        }
        if (Service.getRunState() === RunState.ACTIVE) {
          msg = await Sensor.start(rsp.sensor);
          if (msg) {
            rsp.startMessages.push(msg);
          }
        }
      }
    }
    return res.status(200).json(rsp);
  } catch (err) {
    logger.error(`upserting bulk : ${err.toString()}`);
    return res.status(500).json({message: err.message});
  }
}

async function upsertOne(req, res) {
  try {
    const rsp = {sensor: {}};
    rsp.sensor = await Sensor.upsertOne(req.body);
    if (rsp.sensor.connected) {
      // Stop any reading that might be in progress with old config
      rsp.stopMessages = await Sensor.stop(rsp.sensor);
      if (Service.getRunState() === RunState.ACTIVE) {
        rsp.stopMessages = await Sensor.start(rsp.sensor);
      }
    }
    return res.status(200).json(rsp);
  } catch (err) {
    logger.error(`upserting one : ${err.toString()}`);
    return res.status(500).json({message: err.message});
  }
}

async function deleteOne(req, res) {
  try {
    const sensor = await Sensor.deleteOne(req.params.deviceId);
    return res.status(200).json(sensor);
  } catch (err) {
    logger.error(`deleting one : ${err.toString()}`);
    return res.status(400).json({message: err.message});
  }
}

async function rebootAll(req, res) {
  try {
    const statuses = await Sensor.commandAll('reboot');
    return res.status(202).json(statuses);
  } catch (err) {
    logger.error(`rebooting all : ${err.toString()}`);
    return res.status(500).json({message: err.message});
  }
}

async function rebootOne(req, res) {
  try {
    const sensor = await Sensor.getOne(req.params.deviceId);
    let status = await Sensor.reboot(sensor);
    if (!status) { status = 'Reboot in progress';}
    const statusRsp = { deviceId: sensor.deviceId, status: status };
    return res.status(202).json(statusRsp);
  } catch (err) {
    logger.error(`rebooting one : ${err.toString()}`);
    return res.status(400).json({message: 'Bad Request'});
  }
}

async function getRunState(req, res) {
  try {
    return res.status(200).json({ runState: Service.getRunState()});
  } catch (err) {
    logger.error(`getting run state : ${err.toString()}`);
    return res.status(400).json({message: 'Bad Request'});
  }
}

async function putRunState(req, res) {
  try {
    const [runState, statuses] = await Service.setRunState(req.body.runState);
    return res.status(200).json({ runState: runState, statuses: statuses});
  } catch (err) {
    logger.error(`putting run state : ${err.toString()}`);
    return res.status(500).json({message: err.message});
  }
}

module.exports = {
  getAll,
  getOne,
  upsertBulk,
  upsertOne,
  deleteOne,
  rebootAll,
  rebootOne,
  getRunState,
  putRunState,
};
