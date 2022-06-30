<!--
  - Copyright (C) 2022 Intel Corporation
  - SPDX-License-Identifier: BSD-3-Clause
  -->

<template>
  <div class="w3-row">
    <div class="w3-col s12">
      <input
        type="text"
        :value="localValue"
        @input="onInput($event.target.value)"
        @change="onChange"
        :placeholder="placeholder"
      />
      &nbsp;
      <i
        class="fa fa-info-circle w3-large"
        title="hexadecimal characters and '%' as wildcard - example: AABB%123"
      ></i>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    filter: String,
    placeholder: String,
  },
  emits: ["change"],
  data() {
    return {
      // specifically DO NOT use the property as
      // it gets updated by fetching data from the
      // backend, and updated values from this input
      // should only be transmitted when editing/changing
      // is complete as it should trigger a fetch to show
      // the results correctly.
      localValue: this.filter,
    };
  },
  methods: {
    onInput(v) {
      this.localValue = v.replace(/[^A-Fa-f0-9%]/g, "").toUpperCase();
      if (this.localValue !== v) {
        this.$forceUpdate();
      }
    },
    onChange() {
      this.$emit("change", this.localValue);
    },
  },
};
</script>
