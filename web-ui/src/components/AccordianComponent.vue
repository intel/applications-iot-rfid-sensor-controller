<!--
  - Copyright (C) 2022 Intel Corporation
  - SPDX-License-Identifier: BSD-3-Clause
  -->

<template>

  <div class="w3-row w3-black w3-border-bottom">
    <div class="w3-half">
      <div class="w3-row">

        <div
          class="w3-col w3-button"
          style="width: 10%"
          @click="accordionDetail = !accordionDetail"
        >
          <i :class="{'fa fa-chevron-up': accordionDetail, 'fa fa-chevron-down': !accordionDetail }" />
        </div>
        <div class="w3-rest">
          <h4>
            <slot name="label">&nbsp;</slot>
          </h4>
        </div>

      </div>

    </div>

    <div class="w3-half">
      <div class="w3-row w3-right">
        <div class="w3-bar w3-right">
          <slot name="control-bar-items">&nbsp;</slot>
        </div>
      </div>
    </div>

  </div>

  <div
    class="w3-padding w3-border-bottom w3-hide"
    :class="{ 'w3-show': accordionDetail }"
  >
    <slot name="detail">&nbsp;</slot>
  </div>

</template>

<script>
export default {
  name: "AccordianComponent",
  data() {
    return {
      accordionDetail: false,
    }
  }
}
</script>
