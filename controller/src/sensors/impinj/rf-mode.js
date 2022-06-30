/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

const Region = require('./region');

const lookup = Object.freeze([
  [100, 120, 142, 185, 140, 1110, 1111, 1112],
  [201, 221, 240, 284, 242, 1210, 1211, 1212],
  [301, 322, 340, 381, 341, 1310, 1311, 1312],
]);

const Mode = Object.freeze({
  HighThroughput: 'Mode 0 - High Throughput',
  Hybrid: 'Mode 1 - Hybrid',
  DenseReaderM4: 'Mode 2 - Dense Reader M4',
  DenseReaderM8: 'Mode 3 - Dense Reader M8',
  MaxMiller: 'Mode 4/5 - Max Miller',
  AutosetDenseReaderDeepScan: 'Mode 1002 - Autoset Dense Reader Deep Scan',
  AutosetStaticFast: 'Mode 1003 - Autoset Static Fast',
  AutosetStaticDenseReader: 'Mode 1004 - Autoset Static Dense Reader'
});

function getRfMode(regionString, modeString) {

  let regionIndex;
  let modeIndex;

  switch (regionString) {
    case Region.EUHB:
      regionIndex = 2;
      break;
    case Region.EULB:
      regionIndex = 1;
      break;
    default:
      regionIndex = 0;
      break;
  }
  switch (modeString) {
    case Mode.HighThroughput:
      modeIndex = 0;
      break;
    case Mode.Hybrid:
      modeIndex = 1;
      break;
    case Mode.DenseReaderM4:
      modeIndex = 2;
      break;
    case Mode.DenseReaderM8:
      modeIndex = 3;
      break;
    case Mode.MaxMiller:
      modeIndex = 4;
      break;
    case Mode.AutosetDenseReaderDeepScan:
      modeIndex = 5;
      break;
    case Mode.AutosetStaticFast:
      modeIndex = 6;
      break;
    case Mode.AutosetStaticDenseReader:
      modeIndex = 7;
      break;
    default:
      modeIndex = 0;
      break;
  }

  return lookup[regionIndex][modeIndex];
}

module.exports = {
  getRfMode,
};
