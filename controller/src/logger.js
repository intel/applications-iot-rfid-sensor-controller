/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */
const winston = require('winston');
const fs = require('fs');
const path = require('path');
const {combine, timestamp, printf} = winston.format;

const format = printf(msg => {
  return `${msg.timestamp} ${msg.level}: ${msg.category}: ${msg.message}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(timestamp(), format),
  transports: [
    new winston.transports.Console(),
  ],
});

if (process.env.LOG_FILE) {
  const baseDir = path.dirname(process.env.LOG_FILE);
  if (!fs.existsSync(baseDir)) {
    try {
      fs.mkdirSync(baseDir, {recursive: true});
      logger.info(`logger: created ${baseDir}`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
  }
  logger.add(new winston.transports.File({filename: `${process.env.LOG_FILE}`}));
}

module.exports = function(category) {
  // set the default category of the child
  return logger.child({category: category});
};
