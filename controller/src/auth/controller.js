/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

const bcrypt = require('bcryptjs');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const logger = require('../logger')('auth-controller');

const authDir = process.env.DIR_AUTH || './run/auth';
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, {recursive: true});
  logger.info(`created ${authDir}`);
}
const secretFile = `${authDir}/secret`;
let secret = '';
try {
  secret = fs.readFileSync(secretFile, 'utf8');
} catch (err) {
  secret = require('crypto').randomBytes(48).toString('hex');
  fs.writeFileSync(secretFile, secret, 'utf8');
  logger.info('auth-controller: generated new secret');
}

const pwFile = `${authDir}/password`;
const userId = 'admin';

function logIn(req, res) {
  // is password in the req?
  const plainPw = req.body.password;
  if (!plainPw) {
    res.status(404).json({ message: 'missing password'});
    return;
  }

  try {
    const hashedPw = fs.readFileSync(pwFile, 'utf8');
    if (bcrypt.compareSync(plainPw, hashedPw)) {
      returnLoginSuccess(res);
    } else {
      res.status(401).json({ message: 'invalid password'});
    }
  } catch (err) {
    // this catch block is expected on initial
    // startup of the app or clearing out the
    // password file i.e. password reset
    if (isValidFormat(plainPw)) {
      savePassword(plainPw);
      returnLoginSuccess(res);
    } else {
      res.status(401).json({ message: 'invalid password'});
    }
  }
}

// be careful! expiresIn is interpreted as seconds if a numeric type
// if a string type with no explicit units "2 days", then milliseconds
// is the default
function returnLoginSuccess(res) {
  try {
    const userToken = jwt.sign({userId: userId}, secret, {expiresIn: 3600}, null);
    logger.info(`login success : token ${userToken}`);
    res.status(200).json(
      {
        userId: userId,
        token: userToken,
      }
    );
  } catch (err) {
    logger.error(`login failure : ${err.toString()}`);
    return res.status(500).json({message: err.message});
  }
}

function isValidFormat(pw) {
  return pw.length >= 8;
}

function savePassword(plainPw) {
  bcrypt.hash(plainPw, 10, (err, hashed) => {
    if (err) {
      logger.error(err.message);
    }
    if (hashed) {
      fs.writeFileSync(pwFile, hashed, 'utf8');
    }
  });
}

function verifyToken(req, res, next) {
  const authHeader = String(req.headers['authorization'] || '');
  if (!authHeader.startsWith('Bearer')) {
    return res.status(404).json({ message: 'missing authentication token'});
  }
  const token = authHeader.substring(7, authHeader.length);
  try {
    const decoded = jwt.verify(token, secret, null, null);
    req.userId = decoded.id;
    next();
  } catch (err) {
    logger.error(`verifying token : ${err.toString()}`);
    return res.status(401).json({ message: 'unauthorized'});
  }
}

module.exports = {
  logIn,
  verifyToken,
};
