/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

const TagState = require('./state');

module.exports = (sequelize, Sequelize) => {

  return sequelize.define('tag', {
    epc: {
      type: Sequelize.STRING,
      allowNull: false,
      primaryKey: true
    },
    tid: {
      type: Sequelize.STRING
    },
    state: {
      type: Sequelize.ENUM(
        TagState.PRESENT,
        TagState.EXITING,
        TagState.DEPARTED_EXIT,
        TagState.DEPARTED_POS),
      defaultValue: TagState.PRESENT
    },
    location: {
      type: Sequelize.JSON,
    },
    facilityId: {
      type: Sequelize.STRING,
    },
    lastRead: {
      type: Sequelize.STRING,
    },
    lastArrived: {
      type: Sequelize.STRING,
    },
    lastMoved: {
      type: Sequelize.STRING,
    },
    lastDeparted: {
      type: Sequelize.STRING,
    }
  });
};
