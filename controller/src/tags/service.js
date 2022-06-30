/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

const Tag = require('./tag');
const Sensor = require('../sensors/sensor');
const mqttService = require('../mqtt/service');
const logger = require('../logger')('tag-service');

mqttService.subscribeData(handleDataMsg);

async function handleDataMsg(msg) {
  const jsonMsg = JSON.parse(msg);
  if (jsonMsg.tagInventoryEvent) {
    await Tag.onTagInventoryEvent(jsonMsg.hostname, jsonMsg.tagInventoryEvent);
  }
  if (jsonMsg.inventoryStatusEvent) {
    await Sensor.onInventoryStatusEvent(jsonMsg.hostname, jsonMsg.inventoryStatusEvent);
  }
}

let checkDepartedInterval = null;

async function start() {
  try {
    await Tag.updateCache();
    checkDepartedInterval = setInterval(Tag.checkForDepartedExit, 1000);
    logger.info('started');
  } catch (err) {
    err.message = `tag-service start unsuccessful ${err.message}`;
    throw err;
  }
}

async function stop() {
  try {
    clearInterval(checkDepartedInterval);
    logger.info('stopped');
    await Tag.persistCache();
  } catch (err) {
    err.message = `tag-service stop unsuccessful ${err.message}`;
    throw err;
  }
}

module.exports = {
  start,
  stop
};

