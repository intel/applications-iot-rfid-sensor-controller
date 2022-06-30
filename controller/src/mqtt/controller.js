/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

const mqttService = require('./service');
const logger = require('../logger')('mqtt-controller');

async function getConfig(req, res) {
  try {
    return res.status(200).json(mqttService.getConfig());
  } catch (err) {
    logger.error(`getting config : ${err.toString()}`);
    return res.status(500).json({message: err.message});
  }
}

async function postConfig(req, res) {
  try {
    const cfg = await mqttService.setConfig(req.body);
    return res.status(200).json(cfg);
  } catch (err) {
    logger.error(`posting config : ${err.toString()}`);
    return res.status(400).json({message: err.message});
  }
}

async function deleteConfig(req, res) {
  try {
    const cfg = mqttService.deleteConfig();
    return res.status(200).json(cfg);
  } catch (err) {
    logger.error(`deleting config : ${err.toString()}`);
    return res.status(500).json({message: err.message});
  }
}

module.exports = {
  getConfig,
  postConfig,
  deleteConfig
};
