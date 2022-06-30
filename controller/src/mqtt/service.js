/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

const Mqtt = require('mqtt');
const Config = require('./config');
const logger = require('../logger')('mqtt-service');

let upstreamClient;
let downstreamClient;
const dataSubscribers = [];
const willSubscribers = [];

async function init() {
  upstreamClient = Mqtt.connect(
    Config.getUpstreamUrl(),
    {
      clientId: `snsrcntrlup_${Math.random().toString(16).substr(2, 8)}`,
      username: Config.getUpstreamUsername(),
      password: Config.getUpstreamPassword(),
      clean: true
    });

  upstreamClient.on('connect', function () {
    logger.info(`upstream CONNECTED : ${Config.getUpstreamUrl()}`);
  });

  upstreamClient.on('error', function (error) {
    logger.error(`upstream ERROR : ${error}`);
  });

  upstreamClient.on('message', function (topic, message) {
    logger.error(`upstream message not processed : ${topic} : ${message}`);
  });

  downstreamClient = Mqtt.connect(
    Config.getDownstreamUrl(),
    {
      clientId: `snsrcntrldown_${Math.random().toString(16).substr(2, 8)}`,
      username: Config.getDownstreamUsername(),
      password: Config.getDownstreamPassword(),
      clean: true
    });

  downstreamClient.on('connect', function () {
    logger.info(`downstream CONNECTED : ${Config.getDownstreamUrl()}`);
    downstreamClient.subscribe(Config.Topic.will, {qos: 0});
    downstreamClient.subscribe(Config.Topic.data, {qos: 0});
  });

  downstreamClient.on('error', function (error) {
    logger.error(`downstream ERROR : ${error}`);
    downstreamClient.unsubscribe(Config.Topic.data);
    downstreamClient.unsubscribe(Config.Topic.will);
  });

  downstreamClient.on('message', function (topic, message) {
    switch (topic) {
      case Config.Topic.data:
        dataSubscribers.forEach((callback) => {
          callback(message);
        });
        break;
      case Config.Topic.will:
        willSubscribers.forEach((callback) => {
          callback(message);
        });
        break;
    }
  });
  logger.info('started');
}

async function start() {
  try {
    await init();
  } catch (err) {
    err.message = `mqtt-client start unsuccessful ${err.message}`;
    throw err;
  }
}

async function stop() {
  try {
    // in some startup failure conditions,
    // stop might be called without
    // start having been called so check for
    if (upstreamClient) {
      upstreamClient.end();
    }
    if (downstreamClient) {
      downstreamClient.end();
    }
    logger.info('stopped');
  } catch (err) {
    err.message = `mqtt-client stop unsuccessful ${err.message}`;
    throw err;
  }
}

function subscribeData(callback) {
  dataSubscribers.push(callback);
}

function subscribeWill(callback) {
  willSubscribers.push(callback);
}

function publish(topic, jsonObj) {
  if (upstreamClient.connected) {
    upstreamClient.publish(topic, JSON.stringify(jsonObj));
  }
}

module.exports = {
  start,
  stop,
  publish,
  subscribeData,
  subscribeWill,
};
