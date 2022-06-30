/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

const Status = require('./impinj/status');

module.exports = (sequelize, Sequelize) => {

  const SensorModel = sequelize.define('sensor', {
    deviceId: {
      type: Sequelize.STRING,
      allowNull: false,
      primaryKey: true
    },
    ip4Address: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'unknown'
    },
    behaviorId: {
      type: Sequelize.STRING
    },
    status: {
      type: Sequelize.ENUM(
        Status.Values.UNKNOWN,
        Status.Values.IDLE,
        Status.Values.RUNNING),
      defaultValue: Status.Values.UNKNOWN
    },
    connected: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    antennaPorts: {
      type: Sequelize.JSON
    }
  });

  SensorModel.prototype.getAntennaName = function (port) {
    for (const ap of this.antennaPorts) {
      if (ap.antennaPort === port) {
        return ap.antennaName;
      }
    }
    return '';
  };

  SensorModel.prototype.getFacilityId = function (port) {
    for (const ap of this.antennaPorts) {
      if (ap.antennaPort === port) {
        return ap.facilityId;
      }
    }
    return '';
  };

  SensorModel.prototype.getPersonality = function (port) {
    for (const ap of this.antennaPorts) {
      if (ap.antennaPort === port) {
        return ap.personality;
      }
    }
    return '';
  };

  return SensorModel;
};
