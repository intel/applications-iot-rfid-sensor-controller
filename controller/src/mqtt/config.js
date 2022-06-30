/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

const Topic = Object.freeze({
  alerts: 'rfid/alerts',
  events: 'rfid/events',
  data: 'rfid/data',
  will: 'rfid/will',
});

function getUpstreamHost() {
  return process.env.MQTT_UPSTREAM_HOST || 'localhost';
}

function getUpstreamPort() {
  return process.env.MQTT_UPSTREAM_PORT || 1883;
}

function getUpstreamUsername() {
  return process.env.MQTT_UPSTREAM_USERNAME || '';
}

function getUpstreamPassword() {
  return process.env.MQTT_UPSTREAM_PASSWORD || '';
}

function getUpstreamUrl() {
  const host = getUpstreamHost();
  const port = getUpstreamPort();
  return `mqtt://${host}:${port}`;
}

function getDownstreamHost() {
  return process.env.MQTT_DOWNSTREAM_HOST;
}

function getDownstreamPort() {
  return process.env.MQTT_DOWNSTREAM_PORT || 1883;
}

function getDownstreamUsername() {
  return process.env.MQTT_DOWNSTREAM_USERNAME || '';
}

function getDownstreamPassword() {
  return process.env.MQTT_DOWNSTREAM_PASSWORD || '';
}

function getDownstreamUrl() {
  const host = getDownstreamHost();
  const port = getDownstreamPort();
  return `mqtt://${host}:${port}`;
}

module.exports = {
  Topic,
  getUpstreamHost,
  getUpstreamPort,
  getUpstreamUsername,
  getUpstreamPassword,
  getUpstreamUrl,
  getDownstreamHost,
  getDownstreamPort,
  getDownstreamUsername,
  getDownstreamPassword,
  getDownstreamUrl,
};
