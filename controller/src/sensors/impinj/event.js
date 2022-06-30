/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

const InventoryStatusValues = Object.freeze({
  IDLE: 'idle',
  RUNNING: 'running',
  ARMED: 'armed'
});

const TagInventoryEvent = {
  epcHex: '',
  tidHex: '',
  antennaPort: 0,
  antennaName: '',
  peakRssiCdbm: 0,
  frequency: 0,
  transmitPowerCdbm: 0,
  lastSeenTime: '',
  phaseAngle: 0.0
};

const InventoryStatusEvent = {
  inventoryStatus: InventoryStatusValues.IDLE
};

const CommonEvent = {
  timestamp: '',
  hostname: ''
};

function getCommonEvent(hostname) {
  const date = new Date();
  const event = Object.assign({}, CommonEvent);
  event.hostname = hostname;
  event.timestamp = date.toISOString();
  return event;
}

function getInventoryStatusEvent(hostname, status) {
  const event = getCommonEvent(hostname);
  const inventoryStatusEvent = Object.assign({}, InventoryStatusEvent);
  inventoryStatusEvent.inventoryStatus = status;
  event.inventoryStatusEvent = inventoryStatusEvent;
  return event;
}

function getTagInventoryEvent(hostname) {
  const event = getCommonEvent(hostname);
  event.tagInventoryEvent = Object.assign({}, TagInventoryEvent);
  return event;
}

module.exports = {
  CommonEvent,
  InventoryStatusValues,
  getInventoryStatusEvent,
  getTagInventoryEvent
};
