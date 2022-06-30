<!--
  - Copyright (C) 2022 Intel Corporation
  - SPDX-License-Identifier: BSD-3-Clause
  -->

<template>
  <div class="w3-row">
    <div class="w3-col l2">Rf Mode</div>
    <div class="w3-col l10">
      <span>
      <input class="txt_input_std" type="text" disabled :value="modelValue"/>
        &nbsp;&nbsp;

      <select :value="region" @change="updatedRegion($event)">
        <option
          v-for="item in regionOpts"
          :value="item.value"
          :key="item.value"
        >
          {{ item.text }}
        </option>
      </select>
      <select :value="mode" @change="updatedMode($event)">
        <option v-for="item in modeOpts" :value="item.value" :key="item.value">
          {{ item.text }}
        </option>
      </select>
      </span>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    modelValue: Number,
  },
  emits: ["update:modelValue"],
  data() {
    return {
      rfModeTable: [
        [100, 120, 142, 185, 140, 1110, 1111, 1112],
        [201, 221, 240, 284, 242, 1210, 1211, 1212],
        [301, 322, 340, 381, 341, 1310, 1311, 1312],
      ],
      regionOpts: [
        {value: "OTHER", text: "All Other Regions"},
        {value: "EULB", text: "EU 865-868 MHz"},
        {value: "EUHB", text: "EU 915-921 MHz"},
      ],
      modeOpts: [
        {value: "HighThroughput", text: "0 - High Throughput"},
        {value: "Hybrid", text: "1 - Hybrid"},
        {value: "DenseReaderM4", text: "2 - Dense Reader M4"},
        {value: "DenseReaderM8", text: "3 - Dense Reader M8"},
        {value: "MaxMiller", text: "4/5 - Max Miller"},
        {
          value: "AutosetDenseReaderDeepScan",
          text: "Mode 1002 - Autoset Dense Reader Deep Scan",
        },
        {value: "AutosetStaticFast", text: "Mode 1003 - Autoset Static Fast"},
        {
          value: "AutosetStaticDenseReader",
          text: "Mode 1004 - Autoset Static Dense Reader",
        },
      ],
    };
  },
  computed: {
    region() {
      let l = this.lookup();
      return this.regionOpts[l.regionIndex].value;
    },
    mode() {
      let l = this.lookup();
      return this.modeOpts[l.modeIndex].value;
    },
  },
  methods: {
    updatedRegion(event) {
      let l = this.lookup();
      for (let i = 0; i < this.regionOpts.length; i++) {
        if (this.regionOpts[i].value === event.target.value) {
          l.regionIndex = i;
        }
      }
      this.notifyNewRfmode(l);
    },
    updatedMode(event) {
      let l = this.lookup();
      for (let i = 0; i < this.modeOpts.length; i++) {
        if (this.modeOpts[i].value === event.target.value) {
          l.modeIndex = i;
        }
      }
      this.notifyNewRfmode(l);
    },
    notifyNewRfmode(indexes) {
      let newRfMode = this.rfModeTable[indexes.regionIndex][indexes.modeIndex];
      this.$emit("update:modelValue", newRfMode);
    },
    lookup() {
      let regionIndex = -1;
      let modeIndex = -1;
      for (let i = 0; i < this.rfModeTable.length; i++) {
        for (let j = 0; j < this.rfModeTable[i].length; j++) {
          if (this.modelValue === this.rfModeTable[i][j]) {
            regionIndex = i;
            modeIndex = j;
            break;
          }
        }
      }
      return {regionIndex: regionIndex, modeIndex: modeIndex};
    },
  },
};
</script>
