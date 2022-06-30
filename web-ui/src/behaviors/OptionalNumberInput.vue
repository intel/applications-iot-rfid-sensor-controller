<!--
  - Copyright (C) 2022 Intel Corporation
  - SPDX-License-Identifier: BSD-3-Clause
  -->

<template>
  <div class="w3-row">
    <div class="w3-col l2">
      <div>
        {{label}}
        <span class="w3-right" v-if=optional>
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
      <input
        class="txt_input_std"
        v-if=enabled
        type="Number"
        :value="local"
        @input="update($event.target.value)"
        :min=min
        :max=max
        :step=step
      />
    </div>

  </div>
</template>

<script>

export default {
  props: {
    modelValue: Number,
    optional: Boolean,
    label: String,
    min: Number,
    max: Number,
    step: Number,
    default: Number,
    validation: Function,
  },
  emits: ["update:modelValue"],
  data() {
    return {
      localValue: this.default
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
      let v = (this.modelValue == null) ? parseInt(this.localValue) : null;
      this.$emit("update:modelValue", v);
    },
    update(v) {
      if(this.validation) {
        this.localValue = this.validation(v);
        if(this.localValue !== v) {
          this.$forceUpdate();
        }
      } else {
        this.localValue = v;
      }
      this.$emit("update:modelValue", parseInt(this.localValue));
    }
  },
};
</script>
