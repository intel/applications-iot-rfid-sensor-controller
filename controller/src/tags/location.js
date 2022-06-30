/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

function getDefault(deviceId, antennaPort, antennaName) {
  return {
    deviceId: deviceId,
    antennaPort: antennaPort,
    antennaName: antennaName,
  };
}

module.exports = {
  getDefault
};
