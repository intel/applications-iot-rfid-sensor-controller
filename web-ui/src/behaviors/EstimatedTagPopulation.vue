<!--
  - Copyright (C) 2022 Intel Corporation
  - SPDX-License-Identifier: BSD-3-Clause
  -->

<template>
  <div class="w3-row">
    <div class="w3-col l2">Estimated Tag Population</div>
    <div class="w3-col l10">
      <span>
      <input class="txt_input_std" type="text" disabled :value="modelValue" />
        &nbsp;&nbsp;
      <input
        class="txt_input_std"
        type="range"
        min="0"
        max="15"
        :value="sliderValue"
        @input="updateSlider"
      />

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
  computed: {
    sliderValue() {
      return Math.log(this.modelValue) / Math.log(2);
    },
  },
  methods: {
    updateSlider(event) {
      let newVal = Math.pow(2, event.target.value);
      this.$emit("update:modelValue", newVal);
    },
  },
};
</script>
