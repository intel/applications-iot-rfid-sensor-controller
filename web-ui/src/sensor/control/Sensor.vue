<!--
  - Copyright (C) 2022 Intel Corporation
  - SPDX-License-Identifier: BSD-3-Clause
  -->

<template>

  <div class="w3-row w3-black w3-border-bottom">
    <div class="w3-threequarter">
      <div class="w3-row">
        <div class="w3-quarter">
          <h4>{{ sensor.deviceId }}</h4>
        </div>
        <div class="w3-threequarter">
          <slot name="command-status">&nbsp;</slot>
        </div>
      </div>
    </div>

    <div class="w3-quarter">
      <div class="w3-row w3-right">
        <div class="w3-bar w3-right">
          <div class="w3-bar-item">
            <div class="box-item-aligned">
              Status: {{ sensor.status }}
              <span v-if="sensor.status === 'running'">
                &nbsp;&nbsp;&nbsp;{{ sensor.behaviorId }}
              </span>
            </div>
          </div>
          <div
            class="w3-bar-item w3-button"
            v-if="!this.sensor.connected"
            title="Not Connected"
          >
            <i class="fa fa-unlink">
            </i>
          </div>
          <div
            class="w3-bar-item w3-button"
            v-else
            :class="{ 'w3-spin': rebooting }"
            title="Reboot"
            @click="this.$emit('reboot', this.sensor.deviceId)"
          >
            <i class="fa fa-power-off"></i>
          </div>

        </div>
      </div>
    </div>

  </div>

</template>

<script>
export default {
  name: "SensorControlComponent",
  components: {},
  emits: ["reboot"],
  props: {
    sensor: {
      type: Object,
      required: true,
    },
    rebootingIds: {
      type: Array,
      required: true,
    },
  },
  computed: {
    rebooting() {
      return this.rebootingIds.includes(this.sensor.deviceId);
    },
  },
  data() {
    return {};
  },
};
</script>
