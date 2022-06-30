/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

const fs = require('fs');

const ToggleString = Object.freeze({
  ENABLED: 'enabled',
  DISABLED: 'disabled'
});

const AntennaIdentifier = Object.freeze({
  ANTENNA_PORT: 'antennaPort',
  ANTENNA_NAME: 'antennaName'
});

const TagIdentifier = Object.freeze({
  EPC: 'epc',
  TID: 'tid'
});

const TagFilterAction = Object.freeze({
  INCLUDE: 'include',
  EXCLUDE: 'exclude'
});

const TagMemoryBank = Object.freeze({
  EPC: 'epc',
  TID: 'tid',
  USER: 'user',
  RESERVED: 'reserved'
});

const FilterVerification = Object.freeze({
  ACTIVE: 'active',
  DISABLED: 'disabled'
});

const FilterLink = Object.freeze({
  UNION: 'union',
  INTERSECTION: 'intersection'
});

const InventorySession = Object.freeze({
  SESSION_0: 0,
  SESSION_1: 1,
  SESSION_2: 2,
  SESSION_3: 3
});

const InventorySearchMode = Object.freeze({
  SINGLE_TARGET: 'single-target',
  DUAL_TARGET: 'dual-target',
  SINGLE_TARGET_WITH_TAG_FOCUS: 'single-target-with-tagfocus',
  SINGLE_TARGET_B_TO_A: 'single-target-b-to-a',
  DUAL_TARGET_WITH_B_TO_A_SELECT: 'dual-target-with-b-to-a-select'
});

const GpiTransition = Object.freeze({
  HIGH_TO_LOW: 'high-to-low',
  LOW_TO_HIGH: 'low-to-high'
});

const CommonEventConfiguration = {
  hostname: ToggleString.ENABLED
};

const TagReportingConfiguration = {
  reportingIntervalSeconds: 0,
  tagCacheSize: 2048,
  antennaIdentifier: AntennaIdentifier.ANTENNA_PORT,
  tagIdentifier: TagIdentifier.EPC
};

const TagInventoryEventConfiguration = {
  tagReporting: {},
  epc: ToggleString.DISABLED,
  epcHex: ToggleString.ENABLED,
  tid: ToggleString.DISABLED,
  tidHex: ToggleString.ENABLED,
  antennaPort: ToggleString.ENABLED,
  transmitPowerCdbm: ToggleString.ENABLED,
  peakRssiCdbm: ToggleString.ENABLED,
  frequency: ToggleString.ENABLED,
  pc: ToggleString.DISABLED,
  lastSeenTime: ToggleString.ENABLED,
  phaseAngle: ToggleString.ENABLED
};

const InventoryEventConfiguration = {
  common: {},
  tagInventory: {}
};

const TagFilter = {
  action: TagFilterAction.INCLUDE,
  tagMemoryBank: TagMemoryBank.EPC,
  bitOffset: 0,
  mask: '0123456789ABCDEFabcdef',
  maskLength: 0
};

const InventoryFilterConfiguration = {
  filters: [],
  filterLink: FilterLink.UNION,
  filterVerification: FilterVerification.DISABLED
};

const TransmitPowerSweepConfiguration = {
  minimumPowerCdbm: 0,
  stepSizeCdb: 0
};

const TagAuthentication = {
  messageHex: '0123456789ABCDEFabcdef'
};

const TagMemoryRead = {
  memoryBank: TagMemoryBank.EPC,
  wordOffset: 0,
  wordCount: 0
};

const InventoryAntennaConfiguration = {
  antennaPort: 0,
  transmitPowerCdbm: 0,
  rfMode: 100,
  inventorySession: InventorySession.SESSION_0,
  inventorySearchMode: InventorySearchMode.SINGLE_TARGET,
  estimatedTagPopulation: 2048,
  // The following are optional.  Add them AS NEEDED!
  //    antennaName,
  //    filtering: {},
  //    powerSweeping: {},
  //    fastId: ToggleString.DISABLED,
  //    receiveSensitivityDbm: 0,
  //    tagAuthentication: {},
  //    tagMemoryReads: [],
  //    tagAccessPasswordHex: "0123456789ABCDEFabcdef"
};

const GpiTransitionEvent = {
  gpi: 0,
  transition: GpiTransition.HIGH_TO_LOW
};

const InventoryStartTrigger = {
  gpiTransitionEvent: {}
};

const InventoryStopTrigger = {
  gpiTransitionEvent: {}
};

const Preset = {
  eventConfig: {},
  antennaConfigs: [],
  // The following are optional.  Add them AS NEEDED!
  //    channelFrequenciesKHz: [],
  //    startTriggers: [],
  //    stopTriggers: []
};

function getDefault(numberOfPorts, powerLevelCdbm) {
  const preset = Object.assign({}, Preset);
  preset.eventConfig = Object.assign({}, InventoryEventConfiguration);
  preset.eventConfig.common = Object.assign({}, CommonEventConfiguration);
  preset.eventConfig.tagInventory = Object.assign({}, TagInventoryEventConfiguration);
  preset.eventConfig.tagInventory.tagReporting = Object.assign({}, TagReportingConfiguration);

  for (let x = 0; x < numberOfPorts; x++) {
    preset.antennaConfigs[x] = Object.assign({}, InventoryAntennaConfiguration);
    preset.antennaConfigs[x].antennaPort = (x + 1);
    preset.antennaConfigs[x].transmitPowerCdbm = powerLevelCdbm;
  }

  return preset;
}

function getFromBehaviorJsonFile(filename) {
  const filenameWithRelativePath = `./config/behaviors/${  filename}`;
  try {
    const behaviorBuffer = fs.readFileSync(filenameWithRelativePath);
    const behavior = JSON.parse(behaviorBuffer.toString());
    return behavior.preset;
  } catch (err) {
    return err;
  }
}

module.exports = {
  ToggleString,
  AntennaIdentifier,
  TagIdentifier,
  TagFilterAction,
  TagMemoryBank,
  FilterLink,
  InventorySession,
  InventorySearchMode,
  GpiTransition,
  CommonEventConfiguration,
  TagReportingConfiguration,
  TagInventoryEventConfiguration,
  InventoryEventConfiguration,
  TagFilter,
  InventoryFilterConfiguration,
  TransmitPowerSweepConfiguration,
  TagAuthentication,
  TagMemoryRead,
  InventoryAntennaConfiguration,
  GpiTransitionEvent,
  InventoryStartTrigger,
  InventoryStopTrigger,
  Preset,
  getDefault,
  getFromBehaviorJsonFile
};
