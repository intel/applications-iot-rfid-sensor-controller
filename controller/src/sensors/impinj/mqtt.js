/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

function getDefault() {
  // MqttConfiguration has no nested objects so use "Object.assign"
  return {
    active: true,
    brokerHostname: '',
    brokerPort: 1883,
    cleanSession: true,
    clientId: '',
    eventBufferSize: 1024,
    eventPerSecondLimit: 1000,
    eventPendingDeliveryLimit: 100,
    eventQualityOfService: 0,
    eventTopic: '',
    keepAliveIntervalSeconds: 0,
    username: '',
    password: '',
    willTopic: '',
    willMessage: '',
    willQualityOfService: 0
  };
}

module.exports = {
  getDefault
};
