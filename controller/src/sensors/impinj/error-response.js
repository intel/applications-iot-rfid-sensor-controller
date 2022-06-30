/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

function getDefault(message) {
  return {
    message: message,
    invalidPropertyId: '',
    detail: ''
  };
}

module.exports = {
  getDefault
};
