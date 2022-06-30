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
      <table class="w3-right">
        <tr>
          <td>
            <div
              class="w3-button"
              @click="showInfo = !showInfo"
            >
              <i class="fa fa-info-circle" />
            </div>
          </td>
          <td>
            <div
              class="w3-bar-item w3-button"
              :class="{ 'w3-disabled': !modified }"
              title="Save"
              @click="saveIfValid"
            >
              <i class="fa fa-save"></i>
            </div>
          </td>
          <td>
            <div
              class="w3-button"
              title="Refresh"
              @click="onRefresh"
            >
              <i
                class="fa fa-refresh"
                :class="{ 'fa-spin': loading }"
              ></i>
            </div>
          </td>
        </tr>
      </table>
    </template>

  </page-header>
  <div class="w3-panel">

    <div class="w3-row">
      <div class="w3-col l12 w3-large">
        Mobility Profile
      </div>
    </div>

    <div class="w3-row">
      <div class="w3-col l2">
        &nbsp;&nbsp;
        holdoff
      </div>
      <div class="w3-col l10">
        <input
          class="txt_input_std"
          :value="local.mobilityProfile.holdoff"
          @input="update('mobilityProfile.holdoff', $event.target.value)"
          type="number"
          min="0"
          step="1000"
        />
        &nbsp;
        milliseconds
      </div>
    </div>
    <div class="w3-row">
      <div class="w3-col l2">
        &nbsp;&nbsp;
        decay slope
      </div>
      <div class="w3-col l10">
        <input
          class="txt_input_std"
          :value="local.mobilityProfile.slope"
          @input="update('mobilityProfile.slope', $event.target.value)"
          type="number"
          step="0.1"
        />
        &nbsp;
        hundredths of dBm per millisecond
      </div>
    </div>

    <div class="w3-row">
      <div class="w3-col l2">
        &nbsp;&nbsp;
        threshold
      </div>
      <div class="w3-col l10">
        <input
          class="txt_input_std"
          :value="local.mobilityProfile.threshold"
          @input="update('mobilityProfile.threshold', $event.target.value)"
          type="number"
          min="0"
          step="10"
        />
        &nbsp;
        hundredths of dBm
      </div>
    </div>

    <div class="w3-row w3-margin-top">
      <div class="w3-col l2">
        &nbsp;&nbsp;
      </div>
      <div class="w3-col l10">
        <div class="w3-dropdown-hover w3-black">
          <button class="w3-button w3-border">Default Mobility Profiles</button>
          <div class="w3-dropdown-content w3-bar-block">
            <button
              class="w3-button"
              @click="onDefaultMobility('high')"
            >
              High Mobility
            </button>
            <button
              class="w3-button"
              @click="onDefaultMobility('low')"
            >
              Low Mobility
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="w3-row w3-margin-top">
      <div class="w3-col l2 w3-large">
        Exit Timeout
      </div>
      <div class="w3-col l10">
        <input
          class="txt_input_std"
          :value="local.exitTimeout"
          @input="update('exitTimeout', $event.target.value)"
          type="number"
          min="0"
          step="1000"
        />
        &nbsp;
        milliseconds
      </div>
    </div>

    <div class="w3-row w3-margin-top">
      <div class="w3-col l2 w3-large">
        Point of Sale<br>Return Holdoff
      </div>
      <div class="w3-col l10">
        <input
          class="txt_input_std"
          :value="local.posReturnHoldoff"
          @input="update('posReturnHoldoff', $event.target.value)"
          type="number"
          min="0"
          step="1000"
        />
        &nbsp;
        milliseconds
      </div>
    </div>

  </div>

  <div
    class="w3-padding w3-border-top w3-border-bottom w3-hide"
    :class="{ 'w3-show': showInfo }"
  >

    The <b>Mobility Profile</b> defines the parameters of the weighted slope formula used in calculating a tag's location.
    Tag location is determined based on the quality of tag reads associated with a sensor/antenna averaged over time.
    For a tag to move from one location to another, the other location must be either a better signal or be more recent.

    <div class="w3-cell-row w3-margin-bottom">
      <div class="w3-cell w3-container">
        <p>
          <strong>Decay Slope</strong> <small>(hundredths of dBm per millisecond)</small>:
          Used to determine the weight applied to older RSSI values.
          <br>
          Steeper slopes will cause tags to 'move' more quickly, but may result
          in tags bouncing between sensors even without actually moving.
        </p>
        <p>
          <strong>Threshold</strong> <small>(hundredths of dBm)</small>:
          RSSI threshold that must be exceeded for the tag to move from the previous sensor.
        </p>
        <p>
          <strong>Holdoff</strong> <small>(milliseconds)</small>:
          Amount of time in which the weight used is just the threshold, effectively the slope is not used.
        </p>
      </div>
      <div class="w3-cell w3-container w3-white imgbox">

        <img
          class="imgcenter"
          src="@/assets/mobility-profile.png"
          alt="graph of weighted rssi decay formula"
        >
      </div>
    </div>

    <div class="w3-container w3-border-top">
      <p>
        <strong>Exit Timeout</strong> <small>(milliseconds)</small>:
        Tags that have been read by an EXIT sensor will generate a departed event
        if they have not been read by any sensor for this amount of time.
        <br>
        default is 30 seconds
      </p>
      <p>
        <strong>Point of Sale Return Holdoff</strong> <small>(milliseconds)</small>:
        For tags that have departed by POS, this time threshold must be exceeded before the tag will be
        'returned' to inventory.
        <br>
        default is 1 day (24 * 60 * 60 * 1000)

      </p>
    </div>
  </div>

</template>

<script>
import axios from "axios";
import {cloneDeep, isEqual} from "lodash";
import PageHeader from "@/components/PageHeader.vue";
import Utils from "@/utils";

export default {
  name: "EventsCompent",
  components: {
    PageHeader,
  },
  data() {
    return {
      pageErrors: [],
      loading: false,
      showInfo: false,
      original: { mobilityProfile: {} },
      local: { mobilityProfile: {} },
      modified: false,
    };
  },
  mounted() {
    if(this.$store.state.auth.loggedIn) {
      this.onRefresh();
    }
  },
  watch: {
    "$store.state.auth.loggedIn"(val) {
      if (val) {
        this.onRefresh();
      }
    },
  },
  methods: {
    getEventCfg() {
      this.loading = true;
      axios
        .get("/events")
        .then((rsp) => {
          if (!rsp || !rsp.data) { throw new Error() }
          this.original = rsp.data;
          this.local = cloneDeep(this.original);
        })
        .catch((err) => {
          Utils.responseErrorChain(err, this.pageErrors);
        });
      this.loading = false;
    },
    onRefresh() {
      if (this.modified && !window.confirm("Changes will be lost! Continue?")) {
        return;
      }
      this.modified = false;
      this.getEventCfg();
    },
    onDefaultMobility(type) {
      switch (type) {
        case "high":
          this.local.mobilityProfile.holdoff = 0;
          this.local.mobilityProfile.slope = -0.8;
          this.local.mobilityProfile.threshold = 600;
          break;
        case "low":
          this.local.mobilityProfile.holdoff = 30000;
          this.local.mobilityProfile.slope = -0.2;
          this.local.mobilityProfile.threshold = 600;
          break;
      }
      if (this.validate()) {
        this.checkForSave();
      }
    },
    update(key, val) {
      switch (key) {
        case "mobilityProfile.holdoff":
          this.local.mobilityProfile.holdoff = parseInt(val);
          break;
        case "mobilityProfile.slope":
          this.local.mobilityProfile.slope = parseFloat(val);
          break;
        case "mobilityProfile.threshold":
          this.local.mobilityProfile.threshold = parseInt(val);
          break;
        case "exitTimeout":
          this.local.exitTimeout = parseInt(val);
          break;
        case "posReturnHoldoff":
          this.local.posReturnHoldoff = parseInt(val);
          break;
      }
      if (this.validate()) {
        this.checkForSave();
      }
    },
    validate() {
      return true;
    },
    saveIfValid() {
      if (!this.modified) {
        return;
      }
      if (!this.validate()) {
        alert("Please fix the errors indicated");
        return;
      }
      axios
        .post("/events", this.local)
        .then(() => {
          this.original = cloneDeep(this.local);
          this.modified = false;
        })
        .catch((err) => {
          Utils.responseErrorChain(err, this.pageErrors);
        });
    },
    checkForSave() {
      this.modified = !isEqual(this.original, this.local);
    },
  },
};
</script>

<style scoped>
.imgbox {
  max-width: 600px;
}
.imgcenter {
  max-width: 100%;
  max-height: 100vh;
  margin: auto;
}
</style>
