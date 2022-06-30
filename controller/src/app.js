/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

const express = require('express');
const db = require('./persist/db');

const authController = require('./auth/controller');
const sensorService = require('./sensors/service');
const tagService = require('./tags/service');
const mqttService = require('./mqtt/service');

// Initialize the app
const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Set proper Headers on Backend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(204).json({});
  }
  res.header('Content-Security-Policy', 'frame-ancestors "none"');
  // Disable caching for content files
  // was getting 304 on GET against the tags
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');

  next();
});

app.use('/api/v01/auth', require('./auth/router'));
app.use(authController.verifyToken);

app.use('/api/v01/behaviors', require('./behaviors/router'));
app.use('/api/v01/events', require('./events/router'));
app.use('/api/v01/firmware', require('./firmware/router'));
app.use('/api/v01/mqtt', require('./mqtt/router'));
app.use('/api/v01/sensors', require('./sensors/router'));
app.use('/api/v01/tags', require('./tags/router'));

app.get('/', (req, res) => {
  res.send('Hello from the RFID Controller');
});

app.start = async function () {
  await db.start();
  await sensorService.start();
  await tagService.start();
  await mqttService.start();
};

app.stop = async function () {
  await mqttService.stop();
  await tagService.stop();
  await sensorService.stop();
  await db.stop();
};

module.exports = app;
