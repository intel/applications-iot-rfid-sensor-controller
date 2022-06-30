/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

const Type = Object.freeze({
  UNKNOWN: 'unknown',
  ARRIVAL: 'arrival',
  DEPARTED: 'departed',
  MOVED: 'moved',
  CYCLE_COUNT: 'cycle_count'
});

function getEvent(sentOn, deviceId) {
  return {
    sentOn: sentOn,
    deviceId: deviceId,
    items: [],
  };
}

function getEventItem(facilityId,
  epc,
  tid,
  type,
  timestamp,
  location) {
  return {
    facilityId: facilityId,
    epc: epc,
    tid: tid,
    type: type,
    timestamp: timestamp,
    location: location
  };
}

module.exports = {
  Type,
  getEvent,
  getEventItem

};
