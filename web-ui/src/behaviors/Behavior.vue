<!--
  - Copyright (C) 2022 Intel Corporation
  - SPDX-License-Identifier: BSD-3-Clause
  -->

<template>
  <accordian-component>
    <template v-slot:label>{{ local.id }}</template>
    <template v-slot:control-bar-items>

      <div
        class="w3-bar-item w3-button"
        :class="{ 'w3-disabled': !modified }"
        title="Save"
        @click="modified && this.$emit('save', this.local)"
      >
        <i class="fa fa-save"></i>
      </div>
      <div
        class="w3-bar-item w3-button"
        title="Download"
        @click="onDownload"
      >
        <i class="fa fa-download"></i>
      </div>
      <div
        class="w3-bar-item w3-button"
        title="Copy"
        @click="this.$emit('copy', this.local)"
      >
        <i class="fa fa-copy"></i>
      </div>
      <div
        class="w3-bar-item w3-button"
        title="Delete"
        @click="this.$emit('delete')"
      >
        <i class="fa fa-trash"></i>
      </div>
    </template>

    <template
      v-slot:detail
      v-if="local.preset"
    >
      <div class="w3-container w3-gray">

        <triggers
          label="Start Triggers"
          :modelValue="local.preset.startTriggers"
          @update:modelValue="updatePreset('startTriggers', $event)"
        />

        <triggers
          label="Stop Triggers"
          :modelValue="local.preset.stopTriggers"
          @update:modelValue="updatePreset('stopTriggers', $event)"
        />

        <channel-freqs
          :modelValue="local.preset.channelFrequenciesKHz"
          @update:modelValue="updatePreset('channelFrequenciesKHz', $event)"
        />

        <!-- ANTENNA CONFIGURATIONS -->
        <div class="w3-row">
          <div class="w3-col l2">
            <em>Antenna Configurations</em>
            <span class="w3-right">
              <button
                class="w3-tiny"
                @click="addAntennaCfg()"
                title="Add an Antenna Configuration"
              >
                <i class="fa fa-plus"></i>
              </button>
            </span>
          </div>
        </div>
        <div
          v-for="(antCfg, antCfgIdx) in local.preset.antennaConfigs"
          :key="antCfgIdx"
          class="w3-panel w3-light-gray"
        >
          <antenna-config
            :modelValue="antCfg"
            @update:modelValue="updateAntennaCfg(antCfgIdx, $event)"
          />
        </div>

      </div>
    </template>
  </accordian-component>
</template>

<script>
import { cloneDeep, isEqual } from "lodash";
import AccordianComponent from "@/components/AccordianComponent.vue";
import AntennaConfig from "./AntennaConfig.vue";
import ChannelFreqs from "./ChannelFreqs.vue";
import Triggers from "./Triggers.vue";
import Utils from "@/utils";

export default {
  name:  "BehaviorCompent",
  emits: ["copy", "save", "delete", "modify"],
  props: {
    behavior: {
      type: Object,
      required: true,
    },
  },
  watch: {
    // this aligns values from parent when that model is changed
    // and also disables the save button until something is modified
    behavior(newValue) {
      this.local = cloneDeep(newValue);
      this.original = newValue;
      this.modified = false;
    },
  },
  components: {
    AccordianComponent,
    AntennaConfig,
    ChannelFreqs,
    Triggers,
  },
  data() {
    return {
      local: cloneDeep(this.behavior),
      original: this.behavior,
      modified: false,
      accordionDetail: false,
    };
  },
  methods: {
    onDownload() {
      Utils.download(this.local.id, this.local);
    },
    newAntennaCfg() {
      return {
        antennaPort: 1,
        transmitPowerCdbm: 1500,
        rfMode: 1111,
        inventorySession: 0,
        inventorySearchMode: "single-target",
        estimatedTagPopulation: 1024,
      };
    },
    addAntennaCfg() {
      Utils.pushSequentialArrayObj(
        this.local.preset,
        "antennaConfigs",
        this.newAntennaCfg(),
        "antennaPort"
      );
      this.checkForSave();
    },
    updateAntennaCfg(index, cfg) {
      if (cfg != null) {
        this.local.preset.antennaConfigs[index] = cfg;
      } else {
        Utils.removeArrayObj(this.local.preset, "antennaConfigs", index);
      }
      this.checkForSave();
    },
    updatePreset(prop, value) {
      if (value !== null) {
        this.local.preset[prop] = value;
      } else {
        delete this.local.preset[prop];
      }
      this.checkForSave();
    },
    checkForSave() {
      this.modified = !isEqual(this.original, this.local);
      this.$emit("modify", this.modified);
    },
  },
};
</script>

