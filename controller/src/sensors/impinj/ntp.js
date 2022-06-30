/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

const Active = {
  active: true
};

const NtpServer = {
  serverId: 1,
  server: 'pool.ntp.org',
  serverType: 'static'
};

const NtpServerString = {
  server: 'pool.ntp.org'
};

function getDefaultServer() {
  return Object.assign({}, NtpServerString);
}

function getDefault(serverId) {
  const ntpServer = Object.assign({}, NtpServer);
  ntpServer.serverId = serverId;
  return ntpServer;
}

module.exports = {
  Active,
  NtpServer,
  NtpServerString,
  getDefaultServer,
  getDefault
};
