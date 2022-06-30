/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

const {Sequelize, Op} = require('sequelize');
const logger = require('../logger')('db-client');

const sequelize = new Sequelize(
  process.env.POSTGRES_DB || 'postgres',
  process.env.POSTGRES_USER || 'postgres',
  process.env.POSTGRES_PASSWORD,
  {
    logging: false,
    host: process.env.POSTGRES_HOST || 'localhost',
    dialect: 'postgres',
    define: {
      timestamps: false
    },
  });


const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.Op = Op;

db.tags = require('../tags/db-tag-model')(sequelize, Sequelize);
db.tagStats = require('../tags/db-tag-stats-model')(sequelize, Sequelize);
db.sensors = require('../sensors/db-model')(sequelize, Sequelize);

db.start = async function () {
  try {
    logger.info(`connecting ${sequelize.config.host}:${sequelize.config.port} ` +
      `user:${sequelize.config.username} database:${sequelize.config.database}`);
    await sequelize.authenticate();
    logger.info('synchronizing');
    await sequelize.sync({force: false});
    logger.info(`started ${sequelize.config.host}`);
  } catch (err) {
    err.message = `db: start unsuccessful ${err.message}`;
    throw err;
  }
};

db.stop = async function () {
  try {
    await sequelize.close();
    logger.info(`stopped ${sequelize.config.host}`);
  } catch (err) {
    err.message = `db: stop unsuccessful ${err.message}`;
    throw err;
  }
};

module.exports = db;
