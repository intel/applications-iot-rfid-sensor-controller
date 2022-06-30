<!--
  - Copyright (C) 2022 Intel Corporation
  - SPDX-License-Identifier: BSD-3-Clause
  -->

<template>
  <div
    class="w3-modal"
    style="display: block;"
  >
    <div class="w3-modal-content w3-animate-top"
         @keyup.esc='this.$emit("cancel")'
         @keyup.enter='this.$emit("ok")'
    >
      <div class="w3-bar w3-blue">
        <div class="w3-bar-item w3-large">
          <slot name="label">&nbsp;</slot>
        </div>
      </div>
      <div class="w3-panel w3-white">
        <slot name="content"/>
      </div>
      <div class="w3-bar w3-blue">
        <button
          v-if="showCancelButton"
          class="w3-bar-item w3-button w3-dark-grey"
          @click='this.$emit("cancel")'
        >
          {{ cancelLabel }}
        </button>
        <button
          class="w3-bar-item w3-button w3-dark-grey w3-right"
          @click='this.$emit("ok")'
        >
          {{ okLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ModalCompent",
  emits: ["cancel", "ok"],
  props: {
    okLabel: {
      type: String,
      default: "OK",
    },
    cancelLabel: {
      type: String,
      default: "Cancel",
    },
    showCancelButton: {
      type: Boolean,
      default: true,
    },
  },
};
</script>
