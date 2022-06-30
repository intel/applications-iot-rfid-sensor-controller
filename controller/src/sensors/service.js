/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

const Dnssd = require('dnssd');
const MqttConfig = require('../mqtt/config');
const MqttService = require('../mqtt/service');
const RunState = require('./run-state');
const Sensor = require('./sensor');
const ipminjMqtt = require('./impinj/mqtt');
const logger = require('../logger')('sensor-service');

MqttService.subscribeWill(handleWillMsg);

async function handleWillMsg(deviceId) {
  await Sensor.onDisconnect(deviceId);
}

// Looking for all llrp readers
const dnssdServiceType = 'llrp';
const dnssdBrowser = Dnssd.Browser(Dnssd.tcp(dnssdServiceType));
dnssdBrowser.on('serviceUp', service => {
  void onDnssdEvent('UP', service);
});
dnssdBrowser.on('serviceDown', service => {
  void onDnssdEvent('DOWN', service);
});

async function onDnssdEvent(event, service) {
  const str = JSON.stringify(service);
  const obj = JSON.parse(str);
  const hostname = obj.name;
  const ip4Address = obj.addresses[0];
  switch (event) {
    case 'UP':
      await onDnssdServiceUp(hostname, ip4Address);
      break;
    case 'DOWN':
      await onDnssdServiceDown(hostname, ip4Address);
      break;
    default:
  }
}

async function onDnssdServiceUp(hostname, ip4Address) {
  const sensor = await Sensor.onConnect(hostname, ip4Address);
  if (!sensor) { return; }
  // Stop any rogue reading in progress
  await Sensor.stop(sensor);
  await Sensor.configureMqtt(sensor, getImpinjMqttCfg(sensor));
  if (runState === RunState.ACTIVE) {
    // At this point, any newly created sensors have not yet been configured.
    // Once configured, they will be in the database with a valid behavior and
    // antennaPorts assigned.
    // startSensor will check for the proper conditions
    await Sensor.start(sensor);
  }
}

async function onDnssdServiceDown(hostname, ip4Address) {
  await Sensor.onDisconnect(hostname, ip4Address);
}

function getImpinjMqttCfg(sensor) {
  const impinjCfg = ipminjMqtt.getDefault();
  impinjCfg.brokerHostname = MqttConfig.getDownstreamHost();
  impinjCfg.brokerPort = MqttConfig.getDownstreamPort();
  impinjCfg.username = MqttConfig.getDownstreamUsername();
  impinjCfg.password = MqttConfig.getDownstreamPassword();
  // tag reads are events for Impinj, but the data stream for us
  impinjCfg.eventTopic = MqttConfig.Topic.data;
  impinjCfg.willTopic = MqttConfig.Topic.will;
  // seems can't set the willMessage message to a json string
  // sensorCfg.willMessage = JSON.stringify({sensorId: sensor.deviceId})
  impinjCfg.willMessage = sensor.deviceId;
  impinjCfg.clientId = sensor.deviceId.replaceAll('-', '');
  return impinjCfg;
}

let runState = RunState.ACTIVE;
let statusInterval = null;

async function start() {
  try {
    await Sensor.updateCache();
    await syncSensorStatus();
    statusInterval = setInterval(syncSensorStatus, 30000);
    logger.info('started syncSensorStatus');
    dnssdBrowser.start();
    logger.info('started dnssdBrowser');
  } catch (err) {
    err.message = `sensor-service start unsuccessful ${err.message}`;
    throw err;
  }
}

async function stop() {
  try {
    dnssdBrowser.stop();
    logger.info('stopped dnssdBrowser');
    clearInterval(statusInterval);
    logger.info('stopped syncSensorStatus');
    await Sensor.persistCache();
  } catch (err) {
    err.message = `sensor-service stop unsuccessful ${err.message}`;
    throw err;
  }
}

async function syncSensorStatus() {
  const sensors = await Sensor.getAll();
  for (const sensor of sensors) {
    await Sensor.synchronizeStatus(sensor);
  }
}

function getRunState() {
  return runState;
}

async function setRunState(nextState) {
  logger.info(`setting run state [${runState}] to [${nextState}]`);
  let statuses;
  switch (nextState) {
    case RunState.INACTIVE:
      statuses = await Sensor.commandAll('stop');
      break;
    case RunState.ACTIVE:
      statuses = await Sensor.commandAll('start');
      break;
  }
  runState = nextState;
  return [runState, statuses];
}

module.exports = {
  start,
  stop,
  getRunState,
  setRunState
};
