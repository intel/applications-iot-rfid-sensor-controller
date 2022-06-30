/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

const Behavior = require('./behavior');
const logger = require('../logger')('behavior');

async function getAll(req, res) {
  try {
    const behaviors = Behavior.getAll();
    return res.status(202).json(behaviors);
  } catch (err) {
    logger.error(`getting all : ${err.toString()}`);
    return res.status(500).json({message: err.message});
  }
}

async function getOne(req, res) {
  const behaviorId = req.params.behaviorId;
  try {
    const behavior = Behavior.getOne(behaviorId);
    if (behavior !== null) {
      return res.status(202).json(behavior);
    } else {
      return res.status(400).json({message: `unkown behavior id: ${behaviorId}`});
    }
  } catch (err) {
    logger.error(`getting one : ${err.toString()}`);
    return res.status(500).json({message: err.message});
  }
}

async function upsertOne(req, res) {
  try {
    Behavior.upsertOne(req.body);
    return res.status(202).json(req.body);
  } catch (err) {
    logger.error(`upserting one : ${err.toString()}`);
    return res.status(400).json({message: err.message});
  }
}

async function deleteOne(req, res) {
  const behaviorId = req.params.behaviorId;
  try {
    Behavior.deleteOne(behaviorId);
    return res.status(202).json({message: 'SUCCESS'});
  } catch (err) {
    logger.error(`deleting one : ${err.toString()}`);
    return res.status(400).json({message: err.message});
  }
}

module.exports = {
  getAll,
  getOne,
  upsertOne,
  deleteOne
};
