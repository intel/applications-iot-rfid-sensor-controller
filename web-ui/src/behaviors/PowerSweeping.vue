<!--
  - Copyright (C) 2022 Intel Corporation
  - SPDX-License-Identifier: BSD-3-Clause
  -->

<template>
  <div class="w3-row">
    <div class="w3-col l2">
      <div>
        Power Sweeping
        <span class="w3-right">
          <input
          type="checkbox"
          :checked=enabled
          @click="toggleEnabled"
          class="w3-tiny"
          />
        </span>
      </div>
    </div>

    <div class="w3-col l10" v-if="enabled">

      <div class="w3-bar">
        <table class="w3-bar-item">
          <tr>
            <td>Minimum Power (Cdbm)</td>
            <td>
              <input
                class="txt_input_std"
                :value="local.minimumPowerCdbm"
                @input="update('minimumPowerCdbm', $event.target.value)"
                type="number"
                min="1000"
                step="25"
              />
            </td>
          </tr>

          <tr>
            <td>Step Size (Cdb)</td>
            <td>
              <input
                class="txt_input_std"
                :value="local.stepSizeCdb"
                @input="update('stepSizeCdb', $event.target.value)"
                type="number"
                min="1000"
                step="25"
              />
            </td>
          </tr>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { cloneDeep, tap, set } from "lodash";

export default {
  props: {
    modelValue: Object,
  },
  emits: ["update:modelValue"],
  data() {
    return {
    };
  },
  computed: {
    enabled() {
      return (this.modelValue)
    },
    local() {
      return this.modelValue ? this.modelValue : this.newSweep();
    },
  },
  methods: {
    toggleEnabled() {
      let f = null;
      if (!this.modelValue) {
        f = cloneDeep(this.local);
      }
      this.$emit("update:modelValue", f);
    },
    newSweep() {
      return {
        minimumPowerCdbm: 1000,
        stepSizeCdb: 100
      };
    },
    update(key, value) {
      let f = tap(cloneDeep(this.local), (v) => set(v, key, value));
      this.$emit("update:modelValue", f);
    },
  },
}
</script>
