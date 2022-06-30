/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

const Values = Object.freeze({
  UNKNOWN: 'unknown',
  IDLE: 'idle',
  RUNNING: 'running'
});

function getDefault() {
  return {
    status: Values.UNKNOWN,
    time: '',
    serialNumber: '',
    mqttBrokerConnectionStatus: '',
    mqttTlsAuthentication: '',
    kafkaClusterConnectionStatus: '',
    activePreset: {
      id: null,
      profile: ''
    }
  };
}

module.exports = {
  Values,
  getDefault
};
