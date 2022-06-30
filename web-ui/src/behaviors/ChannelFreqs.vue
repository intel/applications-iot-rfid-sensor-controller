<!--
  - Copyright (C) 2022 Intel Corporation
  - SPDX-License-Identifier: BSD-3-Clause
  -->

<template>
  <div class="w3-row w3-border-bottom">
    <div class="w3-col l2">
      <em>Channel Frequencies</em>
      <span class="w3-right">
        <button
          v-if="moreChannels"
          class="w3-tiny"
          @click="add()"
          title="Add a Channel"
        >
          <i class="fa fa-plus"></i>
        </button>
      </span>
    </div>

    <div
      class="w3-col l10"
      v-if="modelValue"
    >
      <div class="w3-bar">

        <div
          class="w3-bar-item"
          v-for="(freq, index) in local"
          :key=index
        >
          <input
            :value=freq
            @change="update(index, $event.target.value)"
            type="number"
            class="txt_input_std"
            :step=stepSize
            :class="{'w3-border-red': validations.freqsInUse[index] || validations.freqsValue[index]}"
          />
          <span class="w3-right">
            <button
              class="w3-tiny"
              @click="remove(index)"
              title="Remove a Channel"
            >
              <i class="fa fa-minus"></i>
            </button>
          </span>
          <div v-if="validations.freqsValue[index]">
            Must be between 1 and 64
          </div>
          <div v-if="validations.freqsInUse[index]">
            Already in use
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import { cloneDeep } from "lodash";

export default {
  props: {
    modelValue: Array,
  },
  emits: ["update:modelValue"],
  data() {
    return {
      stepSize: 250,
      lowBandMin: 865000,
      lowBandMax: 868000,
      hiBandMin: 902000,
      hiBandMax: 928000,
      validations: {
        freqsInUse: [],
        freqsValue: [],
      },
    };
  },
  computed: {
    enabled() {
      return this.modelValue !== undefined && this.modelValue !== null;
    },
    moreChannels() {
      return this.modelValue ? this.modelValue.length < 50 : true;
    },
    local() {
      return this.modelValue ? this.modelValue : [];
    },
  },
  methods: {
    add() {
      let f = cloneDeep(this.local);
      f.push(parseInt(this.lowBandMin));
      this.$emit("update:modelValue", f);
    },
    remove(index) {
      let f = cloneDeep(this.local);
      f.splice(index, 1);
      if (f.length === 0) {
        f = null;
      }
      this.$emit("update:modelValue", f);
    },
    update(index, value) {
      if (value < this.lowBandMin) {
        if (this.local[index] === this.lowBandMin) {
          value = this.hiBandMax;
        } else {
          value = this.lowBandMin;
        }
      } else if (value > this.lowBandMax && value < this.hiBandMin) {
        if (this.local[index] <= this.lowBandMax) {
          value = this.hiBandMin;
        } else {
          value = this.lowBandMax;
        }
      } else if (value > this.hiBandMax) {
        if (this.local[index] === this.hiBandMax) {
          value = this.lowBandMin;
        } else {
          value = this.hiBandMax;
        }
      }

      let f = cloneDeep(this.local);
      f[index] = parseInt(value);
      this.validate(f);
      this.$emit("update:modelValue", f);
    },
    validate(freqs) {
      let isValid = true;
      const existing = [];
      for (let i = 0; i < freqs.length; i++) {
        const val = freqs[i];
        if (existing.includes(val)) {
          this.validations.freqsInUse[i] = true;
          isValid = false;
        } else {
          this.validations.freqsInUse[i] = false;
        }
        existing.push(val);

        if (
          val < this.lowBandMin ||
          (val > this.lowBandMax && val < this.hiBandMin) ||
          val > this.hiBandMax
        ) {
          this.validations.freqsValue[i] = true;
          isValid = false;
        } else {
          this.validations.freqsValue[i] = false;
        }
      }

      return isValid;
    },
  },
};
</script>
