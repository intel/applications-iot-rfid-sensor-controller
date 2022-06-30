<!--
  - Copyright (C) 2022 Intel Corporation
  - SPDX-License-Identifier: BSD-3-Clause
  -->

<template>
  <div class="w3-row">
    <div class="w3-row">
      <div class="w3-col l2">
        Port
        <span class="w3-right">
          <button
            class="w3-tiny"
            @click="this.$emit('update:modelValue', null)"
            title="Remove this configuration"
          >
            <i class="fa fa-minus"></i>
          </button>
        </span>
      </div>
      <div class="w3-col l10">
        <input
          class="txt_input_std"
          :value="local.antennaPort"
          @input="update('antennaPort', +$event.target.value)"
          type="number"
          min="1"
          max="32"
          step="1"
        />
      </div>
    </div>

    <optional-number-input
      :modelValue="local.transmitPowerCdbm"
      @update:modelValue="update('transmitPowerCdbm', $event)"
      :min="1000"
      :max="3300"
      :step="25"
      :default="2500"
      label="Transmit Power (Cdbm)"
      :optional="false"
    />

    <rf-mode-select
      :modelValue="local.rfMode"
      @update:modelValue="update('rfMode', $event)"
    />

    <optional-number-input
      :modelValue="local.inventorySession"
      @update:modelValue="update('inventorySession', $event)"
      :min="0"
      :max="3"
      :step="1"
      :default="0"
      label="Inventory Session"
      :optional="false"
    />

    <estimated-tag-population
      :modelValue="local.estimatedTagPopulation"
      @update:modelValue="update('estimatedTagPopulation', $event)"
    />

    <filtering
      :modelValue="local.filtering"
      @update:modelValue="update('filtering', $event)"
    />

    <power-sweeping
      :modelValue="local.powerSweeping"
      @update:modelValue="update('powerSweeping', $event)"
    />

    <optional-feature
      :modelValue="local.fastId"
      @update:modelValue="update('fastId', $event)"
      label="Fast Id"
    />

    <optional-text-input
      :modelValue="local.protectedModePinHex"
      @update:modelValue="update('protectedModePinHex', $event)"
      label="Protected Mode Pin"
      placeholder="Enter Pin (hex)"
      :validation="validateHex8"
    />

    <optional-number-input
      :modelValue="local.receiveSensitivityDbm"
      @update:modelValue="update('receiveSensitivityDbm', $event)"
      :min="-12000"
      :max="-4000"
      :step="500"
      :default="-8000"
      label="Rx Sensitivity (dBm)"
      :optional="true"
    />

    <optional-text-input
      :modelValue="local.tagAuthentication"
      @update:modelValue="update('tagAuthentication', $event)"
      label="Tag Authentication"
      placeholder="Enter Message (hex)"
      :validation="validateHex12"
    />

    <tag-memory-reads
      :modelValue="local.tagMemoryReads"
      @update:modelValue="update('tagMemoryReads', $event)"
    />

    <optional-text-input
      :modelValue="local.tagAccessPasswordHex"
      @update:modelValue="update('tagAccessPasswordHex', $event)"
      label="Tag Access Password"
      placeholder="Enter Password (hex)"
      :validation="validateHex8"
    />

    <optional-text-input
      :modelValue="local.tagAccessPasswordWriteHex"
      @update:modelValue="update('tagAccessPasswordWriteHex', $event)"
      label="Tag Access Password Write"
      placeholder="Enter Password (hex)"
      :validation="validateHex8"
    />
  </div>
</template>

<script>
import { cloneDeep } from "lodash";
import EstimatedTagPopulation from "./EstimatedTagPopulation.vue";
import Filtering from "./Filtering.vue";
import OptionalFeature from "./OptionalFeature.vue";
import OptionalNumberInput from "./OptionalNumberInput.vue";
import OptionalTextInput from "./OptionalTextInput.vue";
import PowerSweeping from "./PowerSweeping.vue";
import RfModeSelect from "./RfModeSelect.vue";
import TagMemoryReads from "./TagMemoryReads.vue";
import utils from "@/utils";

export default {
  props: {
    modelValue: Object,
  },
  emits: ["update:modelValue"],
  components: {
    EstimatedTagPopulation,
    Filtering,
    OptionalFeature,
    OptionalNumberInput,
    OptionalTextInput,
    PowerSweeping,
    RfModeSelect,
    TagMemoryReads,
  },
  data() {
    return {};
  },
  computed: {
    local() {
      return this.modelValue ? this.modelValue : {};
    },
  },
  methods: {
    update(prop, value) {
      let f = cloneDeep(this.local);
      if (value !== null) {
        f[prop] = value;
      } else {
        delete f[prop];
      }
      this.$emit("update:modelValue", f);
    },
    ...utils,
  },
};
</script>
