/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

module.exports = (sequelize, Sequelize) => {

  return sequelize.define('tagStats', {
    epc: {
      type: Sequelize.STRING,
      allowNull: false,
      primaryKey: true
    },
    deviceId: {
      type: Sequelize.STRING,
      allowNull: false,
      primaryKey: true
    },
    antennaPort: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    lastRead: {
      type: Sequelize.STRING,
    },
    meanRssi: {
      type: Sequelize.FLOAT,
    },
    interval: {
      type: Sequelize.FLOAT,
    },
    numReads: {
      type: Sequelize.INTEGER,
    }
  });
};
