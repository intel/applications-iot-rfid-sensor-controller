/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

const config = require('./config');
const logger = require('../logger')('event-controller');

async function get(req, res) {
  try {
    return res.status(200).json(config.getConfig());
  } catch (err) {
    logger.error(`get : ${err.toString()}`);
    return res.status(500).json({message: err.message});
  }
}

async function upsert(req, res) {
  try {
    if (!config.validateConfig(req.body)) {
      return res.status(400).json({message: 'invalid configuration'});
    }
    config.setConfig(req.body);
    return res.status(200).json(req.body);
  } catch (err) {
    logger.error(`upsert : ${err.toString()}`);
    return res.status(500).json({message: err.message});
  }
}

module.exports = {
  get,
  upsert
};
