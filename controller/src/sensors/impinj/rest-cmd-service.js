/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

const axios = require('axios');
const formData = require('form-data');
const fs = require('fs');
const path = require('path');
const logger = require('../../logger')('rest-cmd-service');

const apiVersion = '/api/v1';

const Path = Object.freeze({
  status: '/status',
  mqtt: '/mqtt',
  profiles: '/profiles',
  stop: '/profiles/stop',
  presets: '/profiles/inventory/presets',
  system: '/system',
  hostname: '/system/hostname',
  image: '/system/image',
  upgrade: '/system/image/upgrade',
  interfaces: '/system/network/interfaces',
  power: '/system/power',
  region: '/system/region',
  reboot: '/system/reboot',
  time: '/system/time',
  ntp: '/system/time/ntp',
  ntpServers: '/system/time/ntp/servers'
});

axios.defaults.headers['Authorization'] = `Basic ${process.env.IMPINJ_BASIC_AUTH}`;
axios.defaults.headers['Content-Type'] = 'application/json';
axios.defaults.timeout = 2000;

function buildURL(host, path) {
  return `https://${host}${apiVersion}${path}`;
}

async function getStatus(host) {
  return await axios.get(buildURL(host, Path.status));
}

async function getMqttSettings(host) {
  return await axios.get(buildURL(host, Path.mqtt));
}

async function putMqttSettings(host, data) {
  return await axios.put(buildURL(host, Path.mqtt), data);
}

async function getProfiles(host) {
  return await axios.get(buildURL(host, Path.profiles));
}

async function stopPreset(host) {
  return await axios.post(buildURL(host, Path.stop), null);
}

async function getPresets(host) {
  return await axios.get(buildURL(host, Path.presets));
}

async function getPreset(host, presetId) {
  return await axios.get(buildURL(host, `${Path.presets}/${presetId}`));
}

async function putPreset(host, presetId, data) {
  return await axios.put(buildURL(host, `${Path.presets}/${presetId}`), data);
}

async function deletePreset(host, presetId) {
  return await axios.delete(buildURL(host, `${Path.presets}/${presetId}`));
}

async function startPreset(host, presetId) {
  return await axios.post(buildURL(host, `${Path.presets}/${presetId}/start`), null);
}

async function getSystemInfo(host) {
  return await axios.get(buildURL(host, Path.system));
}

async function getHostname(host) {
  return await axios.get(buildURL(host, Path.hostname));
}

async function putHostname(host, data) {
  return await axios.put(buildURL(host, Path.hostname), data);
}

async function getFirmwareInfo(host) {
  return await axios.get(buildURL(host, Path.image));
}

function postFirmwareUpgrade(host, filePath) {
  const fullPath = path.resolve(filePath);
  const fileName = fullPath.substring(fullPath.lastIndexOf('/') + 1, fullPath.length);
  const form = new formData();
  form.append('upgradeFile', fs.createReadStream(fullPath), fileName);
  // using form submit is the only solution that handled the read stream
  // in a way that the Impinj sensor could handle.
  // Axios worked if the whole file was read into memory first with
  // fs.readFileSync() and then using form.getBuffer() for the data.
  form.submit({
    protocol: 'https:',
    host: host,
    path: `${apiVersion}${Path.upgrade}`,
    headers: {Authorization: `Basic ${process.env.IMPINJ_BASIC_AUTH}`}
  }, function(err, res) {
    if (res) {
      logger.info(`post firmware upgrade response : ${res}`);
    }
    if (err) {
      logger.error(`post firmware upgrade response : ${err}`);
    }
  });
}

async function getUpgradeStatus(host) {
  return await axios.get(buildURL(host, Path.upgrade));
}

async function getDcPowerConfig(host) {
  return await axios.get(buildURL(host, Path.power));
}

async function putDcPowerConfig(host, data) {
  return await axios.put(buildURL(host, Path.power), data);
}

async function getOperatingRegion(host) {
  return await axios.get(buildURL(host, Path.region));
}

async function putOperatingRegion(host, data) {
  return await axios.put(buildURL(host, Path.region), data);
}

async function postReboot(host) {
  return await axios.post(buildURL(host, Path.reboot), null);
}

async function getSystemTime(host) {
  return await axios.get(buildURL(host, Path.time));
}

async function putSystemTime(host, data) {
  return await axios.put(buildURL(host, Path.time), data);
}

async function getNtpStatus(host) {
  return await axios.get(buildURL(host, Path.ntp));
}

async function putNtpActive(host) {
  return await axios.put(buildURL(host, Path.ntp), {active: true});
}

async function getNtpServers(host) {
  return await axios.get(buildURL(host, Path.ntpServers));
}

async function postNtpServer(host, ntpHost) {
  return await axios.post(buildURL(host, Path.ntpServers), {server: ntpHost});
}

async function getNtpServer(host, serverId) {
  return await axios.get(buildURL(host, `${Path.ntpServers}/${serverId}`));
}

async function deleteNtpServer(host, serverId) {
  return await axios.delete(buildURL(host, `${Path.ntpServers}/${serverId}`));
}

module.exports = {
  getStatus,
  getMqttSettings,
  putMqttSettings,
  getProfiles,
  stopPreset,
  getPresets,
  getPreset,
  putPreset,
  deletePreset,
  startPreset,
  getSystemInfo,
  getHostname,
  putHostname,
  getFirmwareInfo,
  postFirmwareUpgrade,
  getUpgradeStatus,
  getDcPowerConfig,
  putDcPowerConfig,
  getOperatingRegion,
  putOperatingRegion,
  postReboot,
  getSystemTime,
  putSystemTime,
  getNtpStatus,
  putNtpActive,
  getNtpServers,
  postNtpServer,
  getNtpServer,
  deleteNtpServer
};
