/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

const fs = require('fs');
const cloneDeep = require('lodash/cloneDeep');
const logger = require('../logger')('event-config');

const baseDir = process.env.DIR_CONFIG || './run/config';
const cfgDir = `${baseDir}/events`;
if (!fs.existsSync(cfgDir)) {
  fs.mkdirSync(cfgDir, {recursive: true});
  logger.info(`created ${cfgDir}`);
}
const cfgFile = `${cfgDir}/event-config.json`;
let eventCfg;
try {
  const json = fs.readFileSync(cfgFile, 'utf8');
  eventCfg = JSON.parse(json);
} catch (error) {
  eventCfg = {
    exitTimeout: 30000,
    posReturnHoldoff: 8640000,
    mobilityProfile: {
      holdoff: 0,
      slope: -0.8,
      threshold: 600
    }
  };
  logger.info('initialized using defaults');
}

function getConfig() {
  return cloneDeep(eventCfg);
}

function setConfig(newCfg) {
  eventCfg = cloneDeep(newCfg);
  fs.writeFileSync(cfgFile, JSON.stringify(eventCfg, null, 4), 'utf8');
  logger.info(`set config : ${JSON.stringify(eventCfg, null, 2)}`);
}

function validateConfig(cfg) {
  try {
    if (cfg.exitTimeout < 0) {
      return false;
    }
    if (cfg.posReturnHoldoff < 0) {
      return false;
    }
    if (!cfg.mobilityProfile) {
      return false;
    }
    if (cfg.mobilityProfile.holdoff < 0) {
      return false;
    }
    if (!cfg.mobilityProfile.slope) {
      return false;
    }
    if (!cfg.mobilityProfile.threshold) {
      return false;
    }
  } catch (err) {
    logger.error(`validating : ${err.toString()}`);
    return false;
  }
  return true;
}

function getExitTimeout() {
  return eventCfg.exitTimeout;
}

function getPosReturnHoldoff() {
  return eventCfg.posReturnHoldoff;
}

function getRssiAdjustment(now, lastRead) {

  /*  From the linear equation y = m(x) + b ...
   y = RSSI Adjustment
   m = RSSI decay rate over time (i.e., slope)
   x = Time since last tag read
   b = RSSI threshold (i.e., new location must be better than old by b dB)

   The holdoff is how long to wait before applying the RSSI adjustment,
   so the equation becomes ...
   rssiAdjustment = slope(time - holdoff) + threshold

   Then we bound rssiAdjustment by a (max = threshold) and a (min = -50 dBm)
   creating an RSSI Adjustment curve that looks something like this...

   |
   |   holdoff ms
   |---------------\  + threshold dB
   |                \
   |_________________\_______________________  time in ms
   |                  \
   |                   \
   |                    \
   |                     -------------  -50 dB
   |
   */

  let rssiAdjustment;
  const profile = eventCfg.mobilityProfile;
  const time = (Date.parse(now) - Date.parse(lastRead));
  rssiAdjustment = (profile.slope * (time - profile.holdoff)) + profile.threshold;
  rssiAdjustment = Math.max(Math.min(rssiAdjustment, profile.threshold), -5000);
  return rssiAdjustment;
}

module.exports = {
  getConfig,
  setConfig,
  validateConfig,
  getExitTimeout,
  getPosReturnHoldoff,
  getRssiAdjustment,
};
