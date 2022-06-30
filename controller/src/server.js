/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

const fs = require('fs');
const http = require('http');
const https = require('https');
const logger = require('./logger')('server');
const app = require('./app.js');

const httpPort = 3000;
const httpsPort = 3443;

let httpServer;
let httpsServer;
let serverState = 'init';

async function shutdown(signal) {
  if (serverState === 'stopping') { return; }
  serverState = 'stopping';
  logger.info(`shutdown: ${signal}`);
  if (signal.stack) {
    logger.info(signal.stack);
  }
  if (httpServer) {
    httpServer.close(() => {
      logger.info('closed httpServer');
    });
  }
  if (httpsServer) {
    httpsServer.close(() => {
      logger.info('closed httpsServer');
    });
  }
  await app.stop();
}

// ctrl-c
process.on('SIGINT', shutdown);
process.on('SIGQUIT', shutdown);
process.on('SIGTERM', shutdown);

process.on('uncaughtException', shutdown);

(async () => {
  try {
    await app.start();
    serverState = 'starting';
    // HTTP SERVER
    httpServer = http.createServer(app);
    httpServer.listen(httpPort);
    logger.info(`http server listening on ${httpPort}`);

    // HTTPS SERVER
    const keyFile = process.env.KEY_FILE || './run/certs/controller.rfid.com.key';
    const certFile = process.env.CERT_FILE || './run/certs/controller.rfid.com.crt';
    if (fs.existsSync(certFile) && fs.existsSync(keyFile)) {
      try {
        const key = fs.readFileSync(keyFile, 'utf8');
        const cert = fs.readFileSync(certFile, 'utf8');
        httpsServer = https.createServer({key: key, cert: cert}, app);
        httpsServer.listen(httpsPort);
        logger.info(`https server listening on ${httpsPort}`);
      } catch (err) {
        logger.error(`failed creating https server ${err.message}`);
      }
    } else {
      logger.warn(`https server disabled - missing key ${certFile} or certificate ${certFile}`);
    }
    serverState = 'running';
  } catch (error) {
    logger.error(error);
  }
})();

