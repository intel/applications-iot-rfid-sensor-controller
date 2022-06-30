<!--
  - Copyright (C) 2022 Intel Corporation
  - SPDX-License-Identifier: BSD-3-Clause
  -->

<template>
  <div class="w3-row">
    <div class="w3-col l2">
      <div>
        Tag Filtering
        <span class="w3-right">
          <button
          v-if="moreFilters"
          class="w3-tiny"
          @click="addFilter()"
          title="Add a Tag Filter">
            <i class="fa fa-plus"></i>
          </button>
        </span>
      </div>
      <div v-if="modelValue" class="w3-margin-left">
        <div>Link</div>
        <select
          class="txt_input_std"
          :value="local.filterLink"
          @input="update('filterLink', $event.target.value)"
        >
          <option
            v-for="item in filterLinkOpts"
            :value="item.value"
            :key="item.value"
          >
            {{ item.text }}
          </option>
        </select>
        <div>Verification</div>
        <select
          class="txt_input_std"
          :value="local.filterVerification"
          @input="update('filterVerification', $event.target.value)"
        >
          <option
            v-for="item in filterVerificationOpts"
            :value="item.value"
            :key="item.value"
          >
            {{ item.text }}
          </option>
        </select>
      </div>
    </div>

    <div class="w3-col l10" v-if="modelValue">
      <div class="w3-bar">
        <table
          class="w3-bar-item"
          v-for="(filter, filterIdx) in local.filters"
          :key="filterIdx"
        >
          <tr>
            <td></td>
            <td style="text-align: right;">
              <button
                class="w3-tiny"
                @click="removeFilter(filterIdx)"
                title="Remove this Filter"
              >
                <i class="fa fa-minus"></i>
              </button>
            </td>
          </tr>
          <tr>
            <td>Action</td>
            <td>
              <select
                class="txt_input_std"
                :value="filter.action"
                @input="updateFilter(filterIdx, 'action', $event.target.value)"
              >
                <option
                  v-for="item in filterActionOpts"
                  :value="item.value"
                  :key="item.value"
                >
                  {{ item.text }}
                </option>
              </select>
            </td>
          </tr>
          <tr>
            <td>Tag Memory Bank</td>
            <td>
              <select
                class="txt_input_std"
                :value="filter.tagMemoryBank"
                @input="
                  updateFilter(filterIdx, 'tagMemoryBank', $event.target.value)
                "
              >
                <option
                  v-for="item in filterMemoryBankOpts"
                  :value="item.value"
                  :key="item.value"
                >
                  {{ item.text }}
                </option>
              </select>
            </td>
          </tr>
          <tr>
            <td>Bit Offset</td>
            <td>
              <input
                :value="filter.bitOffset"
                @input="
                  updateFilter(filterIdx, 'bitOffset', $event.target.value)
                "
                type="number"
                min="0"
                max="63"
                step="1"
                class="txt_input_std"
              />
            </td>
          </tr>
          <tr>
            <td>Mask</td>
            <td>
              <input
                :value="filter.mask"
                @input="updateFilter(filterIdx, 'mask', $event.target.value)"
                type="text"
                class="txt_input_std"
              />
            </td>
          </tr>
          <tr>
            <td>Mask Length</td>
            <td>
              <input
                :value="filter.maskLength"
                @input="
                  updateFilter(filterIdx, 'maskLength', $event.target.value)
                "
                type="number"
                min="0"
                max="255"
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
import Utils from "@/utils";

export default {
  name: "FilteringComponent",
  props: {
    modelValue: Object,
  },
  emits: ["update:modelValue"],
  data() {
    return {
      filterVerificationOpts: [
        { value: "disabled", text: "Disabled" },
        { value: "active", text: "Active" },
      ],
      filterActionOpts: [
        { value: "include", text: "Include" },
        { value: "exclude", text: "Exclude" },
      ],
      filterLinkOpts: [
        { value: "union", text: "Union" },
        { value: "intersection", text: "Intersection" },
      ],
      filterMemoryBankOpts: [
        { value: "epc", text: "Epc" },
        { value: "tid", text: "Tid" },
        { value: "user", text: "User" },
        { value: "reserved", text: "Reserved" },
      ],
    };
  },
  computed: {
    moreFilters() {
      return this.modelValue ? this.modelValue.filters.length < 2 : true;
    },
    local() {
      return this.modelValue ? this.modelValue : this.newFiltering();
    },
  },
  methods: {
    newFiltering() {
      return {
        filters: [],
        filterLink: this.filterLinkOpts[0].value,
        filterVerification: this.filterVerificationOpts[0].value,
      };
    },
    newFilter() {
      return {
        action: this.filterActionOpts[0].value,
        tagMemoryBank: this.filterMemoryBankOpts[0].value,
        bitOffset: 0,
        mask: "string",
        maskLength: 0,
      };
    },
    addFilter() {
      let f = cloneDeep(this.local);
      Utils.pushSequentialArrayObj(f, "filters", this.newFilter());
      this.$emit("update:modelValue", f);
    },
    removeFilter(index) {
      let f = cloneDeep(this.local);
      Utils.removeArrayObj(f, "filters", index);
      if (!f.filters || f.filters.length === 0) {
        f = null;
      }
      this.$emit("update:modelValue", f);
    },
    update(key, value) {
      let f = tap(cloneDeep(this.local), (v) => set(v, key, value));
      this.$emit("update:modelValue", f);
    },
    updateFilter(index, key, value) {
      let f = cloneDeep(this.local);
      f.filters[index][key] = value;
      this.$emit("update:modelValue", f);
    },
  },
};
</script>
