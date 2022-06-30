/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

const fs = require('fs');
const logger = require('../logger')('behavior');

const baseDir = process.env.DIR_CONFIG || './run/config';
const cfgDir = `${baseDir}/behaviors`;
if (!fs.existsSync(cfgDir)) {
  fs.mkdirSync(cfgDir, {recursive: true});
  logger.info(`created ${cfgDir}`);
}

function getAll() {
  const behaviors = [];
  try {
    const files = fs.readdirSync(cfgDir);
    files.forEach(file => {
      const behavior = JSON.parse(fs.readFileSync(`${cfgDir}/${file}`, 'utf8'));
      behaviors.push(behavior);});
  } catch (err) {
    logger.error(`getting all : ${err.toString()}`);
  }
  return behaviors;
}

function getOne(behaviorId) {
  let behavior = null;
  try {
    const filenameWithPath = `${cfgDir}/${behaviorId}.json`;
    const json = fs.readFileSync(filenameWithPath, 'utf8');
    behavior = JSON.parse(json);
  } catch (err) {
    logger.error(`getting one : ${err.toString()}`);
  }
  return behavior;
}

function upsertOne(behavior) {
  const filenameWithPath = `${cfgDir}/${behavior.id}.json`;
  fs.writeFileSync(filenameWithPath, JSON.stringify(behavior, null, 4), 'utf8');
  logger.info(`upserted ${filenameWithPath}`);
}

function deleteOne(behaviorId) {
  const filenameWithPath = `${cfgDir}/${behaviorId}.json`;
  fs.unlinkSync(filenameWithPath);
  logger.info(`deleted ${filenameWithPath}`);
}

module.exports = {
  getAll,
  getOne,
  upsertOne,
  deleteOne
};
