<!--
  - Copyright (C) 2022 Intel Corporation
  - SPDX-License-Identifier: BSD-3-Clause
  -->

<template>
  <div class="w3-row">
    <div class="w3-col l2">
      <div>
        {{label}}
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

    <div class="w3-col l10">
    </div>

  </div>
</template>

<script>

export default {
  props: {
    modelValue: String,
    label: String,
  },
  emits: ["update:modelValue"],
  data() {
    return {
      localValue: "enabled"
    };
  },
  computed: {
    enabled() {
      return this.modelValue !== undefined && this.modelValue !== null
    },
    local() {
      return this.modelValue ? this.modelValue : this.localValue;
    }
  },
  methods: {
    toggleEnabled() {
      let v = (this.modelValue == null) ? this.localValue : null;
      this.$emit("update:modelValue", v);
    },
  },
};
</script>
