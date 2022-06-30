<!--
  - Copyright (C) 2022 Intel Corporation
  - SPDX-License-Identifier: BSD-3-Clause
  -->

<template>
  <page-header
    :pageErrors="pageErrors"
    @viewed="pageErrors.splice($event, 1)"
  >
    <template v-slot:right-content>
      <div class="w3-cell w3-cell-bottom">
        Run State
        <on-off-switch
          :state="isActive"
          @changed="toggleRunState"
        />
      </div>
    </template>

  </page-header>

  <div
    v-for="(sensor,index) in sensors"
    v-bind:key="sensor.deviceId"
  >
    <sensor
      :rebootingIds="rebootingIds"
      :sensor="sensor"
      @reboot="onReboot(index, $event)"
    >
      <template v-slot:command-status>
        <div v-if="cmdStatuses[sensor.deviceId]">
          <h6>{{ cmdStatuses[sensor.deviceId] }}</h6>
        </div>
      </template>
    </sensor>
  </div>
</template>

<script>
import axios from "axios";
import OnOffSwitch from "@/components/OnOffSwitch.vue";
import Sensor from "./Sensor.vue";
import PageHeader from "@/components/PageHeader.vue";
import Utils from "@/utils";

export default {
  name: "SensorsControlComponent",
  components: {
    OnOffSwitch,
    PageHeader,
    Sensor,
  },
  data() {
    return {
      loading: false,
      pageErrors: [],
      pollingHandle: null,
      rebootingIds: [],
      sensors: [],
      cmdStatuses: {},
      isActive: false,
    };
  },
  mounted() {
    if (this.$store.state.auth.loggedIn) {
      this.onRefresh();
      this.startPolling();
    }
  },
  beforeUnmount() {
    this.stopPolling();
  },
  watch: {
    "$store.state.auth.loggedIn"(val) {
      if (val) {
        this.onRefresh();
        this.startPolling();
      } else {
        this.stopPolling();
      }
    },
  },
  methods: {
    onRefresh() {
      this.getRunState();
      this.getSensors();
    },
    getRunState() {
      axios
      .get("/sensors/runState")
      .then((rsp) => {
        if (!rsp || !rsp.data) { throw new Error() }
        this.isActive = rsp.data.runState === "active";
      })
      .catch((err) => {
        Utils.responseErrorChain(err, this.pageErrors);
      });
    },
    getSensors() {
      axios
      .get("/sensors")
      .then((rsp) => {
        if (!rsp || !rsp.data) { throw new Error() }
        this.sensors = rsp.data.sort(Utils.sortSensorById);
        const connectedSensors = this.sensors.filter(
          (s) => s.connected === true
        );
        for (const deviceId of connectedSensors) {
          const i = this.rebootingIds.indexOf(deviceId);
          if (i >= 0) {
            this.rebootingIds.splice(i, 1);
          }
        }
      })
      .catch((err) => {
        Utils.responseErrorChain(err, this.pageErrors);
      });
    },
    startPolling() {
      this.pollingHandle = setInterval(this.getSensors, 5000);
    },
    stopPolling() {
      clearInterval(this.pollingHandle);
      this.pollingHandle = null;
    },
    toggleRunState() {
      let newRunState = "inactive";
      if (!this.isActive) {
        newRunState = "active";
      }
      axios
      .put("/sensors/runstate", {runState: newRunState})
      .then((rsp) => {
        if (!rsp || !rsp.data) { throw new Error() }
        this.isActive = (rsp.data.runState === 'active');
        this.cmdStatuses = {};
        for (const cmdStatus of rsp.data.statuses) {
          this.cmdStatuses[cmdStatus.deviceId] = cmdStatus.status;
        }
        this.getSensors()
      })
      .catch((err) => {
        Utils.responseErrorChain(err, this.pageErrors);
      });
    },
    onReboot(index, deviceId) {
      const answer = window.confirm(
        "Do you really want to reboot: " + deviceId + "?"
      );
      if (!answer) return false;
      this.cmdStatuses[deviceId] = '';
      const path = "/sensors/" + deviceId + "/reboot";
      axios
      .put(path, {command: "reboot"})
      .then((rsp) => {
        if (!rsp || !rsp.data) { throw new Error() }
        this.cmdStatuses[rsp.data.deviceId] = rsp.data.status;
        if (this.rebootingIds.indexOf(deviceId) === -1) {
          this.rebootingIds.push(deviceId);
        }

      })
      .catch((err) => {
        Utils.responseErrorChain(err, this.pageErrors);
      });
    },
  },
};
</script>
