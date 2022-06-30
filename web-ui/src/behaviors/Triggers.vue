<!--
  - Copyright (C) 2022 Intel Corporation
  - SPDX-License-Identifier: BSD-3-Clause
  -->

<template>
  <div class="w3-row w3-border-bottom">
    <div class="w3-col l2">
      <em>{{ label }}</em>
      <span
        class="w3-right"
      >
        <button
          class="w3-tiny"
          @click="add()"
          title="Add a Trigger"
          :disabled="this.local.length >= 64"
        >
          <i class="fa fa-plus"></i>
        </button>
      </span>
    </div>
    <div class="w3-col l10">
      <div class="w3-bar">
        <table
          class="w3-bar-item"
          v-for="(trigger, index) in local"
          :key="index"
        >
          <tr>
            <td></td>
            <td align="right">
              <button
                class="w3-tiny"
                @click="remove(index)"
                title="Remove this trigger"
              >
                <i class="fa fa-minus"></i>
              </button>
            </td>
          </tr>
          <tr>
            <td>Pin #</td>
            <td>
              <input
                :value="trigger.gpi"
                @input="update('gpi', index, parseInt($event.target.value))"
                type="number"
                min="1"
                max="64"
                step="1"
                class="txt_input_std"
                :class="{'w3-border-red': validations.gpisInUse[index] || validations.gpisValue[index]}"
              />
              <div v-if="validations.gpisValue[index]">
                Must be between 1 and 64
              </div>
              <div v-if="validations.gpisInUse[index]">
                Already in use
              </div>

            </td>
          </tr>
          <tr>
            <td>Transition</td>
            <td>
              <select
                :value="trigger.transition"
                @input="update('transition', index, $event.target.value)"
                class="txt_input_std"
              >
                <option
                  v-for="item in triggerOpts"
                  :value="item.value"
                  :key="item.value"
                >
                  {{ item.text }}
                </option>
              </select>
            </td>
          </tr>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { cloneDeep } from "lodash";
import Utils from "@/utils";

export default {
  name: "TriggersComponent",
  props: {
    modelValue: Array,
    label: String,
  },
  emits: ["update:modelValue"],
  data() {
    return {
      triggerDefs: [
        { id: "startTriggers", label: "Start Triggers" },
        { id: "stopTriggers", label: "Stop Triggers" },
      ],
      triggerOpts: [
        { value: "high-to-low", text: "High to Low" },
        { value: "low-to-high", text: "Low to High" },
      ],
      validations: {
        gpisInUse: [],
        gpisValue: [],
      },
    };
  },
  computed: {
    enabled() {
      return this.modelValue !== undefined && this.modelValue !== null;
    },
    local() {
      return this.modelValue ? this.modelValue : [];
    },
  },
  methods: {
    newTrigger() {
      return { gpi: 1, transition: this.triggerOpts[0].value };
    },
    add() {
      if (this.local >= 64) {
        return;
      }
      let l = cloneDeep(this.local);
      l.push(this.newTrigger());
      Utils.setLastToGap(l, "gpi", 1, 64);
      this.$emit("update:modelValue", l);
    },
    remove(index) {
      let l = cloneDeep(this.local);
      l.splice(index, 1);
      this.validations.gpisInUse.splice(index, 1);
      this.validations.gpisValue.splice(index, 1);
      if (l.length === 0) {
        l = null;
      }
      this.$emit("update:modelValue", l);
    },
    update(prop, index, value) {
      let l = cloneDeep(this.local);
      l[index][prop] = value;
      this.validate(l);
      this.$emit("update:modelValue", l);
    },
    validate(triggers) {
      let isValid = true;
      const existing = [];
      for (let i = 0; i < triggers.length; i++) {
        const val = triggers[i]["gpi"];
        if (existing.includes(val)) {
          this.validations.gpisInUse[i] = true;
          isValid = false;
        } else {
          this.validations.gpisInUse[i] = false;
        }
        existing.push(val);

        if (val < 1 || val > 64) {
          this.validations.gpisValue[i] = true;
          isValid = false;
        } else {
          this.validations.gpisValue[i] = false;
        }
      }

      return isValid;
    },
  },
};
</script>
