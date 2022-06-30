/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

function getDefault() {
  return {
    primaryFirmware: '',
    secondaryFirmware: '',
    scmRevision: '',
    buildDate: '',
    buildPlan: '',
    devBuild: true
  };
}

module.exports = {
  getDefault
};
