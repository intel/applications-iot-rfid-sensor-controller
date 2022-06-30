<!--
  - Copyright (C) 2022 Intel Corporation
  - SPDX-License-Identifier: BSD-3-Clause
  -->

<template>
  <div class="w3-row">
    <div class="w3-col l2">
      <div>
        Tag Memory Reads
        <span class="w3-right">
          <input
          type="checkbox"
          :checked="(modelValue)"
          @click="toggleEnabled"
          class="w3-tiny"
          />
        </span>
      </div>
    </div>

    <div class="w3-col l10">
      <div class="w3-bar" v-if="modelValue">
        <table class="w3-bar-item">
          <tr>
            <td>Bank</td>
            <td>
              <select
                class="txt_input_std"
                :value="local.memoryBank"
                @input="
                  update('memoryBank', $event.target.value)
                "
              >
                <option
                  v-for="item in memoryBankOpts"
                  :value="item.value"
                  :key="item.value"
                >
                  {{ item.text }}
                </option>
              </select>
            </td>
          </tr>
          <tr>
            <td>Word Offset</td>
            <td>
              <input
                :value="local.wordOffset"
                @input="
                  update('wordOffset', $event.target.value)
                "
                type="number"
                min="0"
                max="65535"
                step="1"
                class="txt_input_std"
              />
            </td>
          </tr>
          <tr>
            <td>Word Count</td>
            <td>
              <input
                :value="local.wordCount"
                @input="
                  update('wordCount', $event.target.value)
                "
                type="number"
                min="1"
                max="60"
                step="1"
                class="txt_input_std"
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
      memoryBankOpts: [
        { value: "epc", text: "Epc" },
        { value: "tid", text: "Tid" },
        { value: "user", text: "User" },
        { value: "reserved", text: "Reserved" },
      ],

    };
  },
  computed: {
    local() {
      return this.modelValue ? this.modelValue : this.newObj();
    }
  },
  methods: {
    toggleEnabled() {
      let v = null;
      if (!this.modelValue) {
        v = this.newObj();
      }
      this.$emit("update:modelValue", v);
    },
    newObj() {
      return {
        memoryBank: this.memoryBankOpts[0].value,
        wordOffset: 0,
        wordCount: 0
      };
    },
    update(key, value) {
      let m = tap(cloneDeep(this.local), (v) => set(v, key, value));
      this.$emit("update:modelValue", m);
    },
  },
};
</script>
