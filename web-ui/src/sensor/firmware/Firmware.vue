<!--
  - Copyright (C) 2022 Intel Corporation
  - SPDX-License-Identifier: BSD-3-Clause
  -->

<template>

  <page-header
    :pageErrors="pageErrors"
    @viewed="pageErrors.splice($event, 1)"
  >
  </page-header>

  <accordian-component>
    <template v-slot:label>Images</template>
    <template v-slot:control-bar-items>
      <div class="w3-bar-item">
        <i
          v-if="uploadProps.state === 'inactive'"
          class="fa fa-upload w3-button w3-larget"
          title="Upload"
          @click="onUpload"
        ></i>
        <div v-if="uploadProps.state === 'progress'">
          {{ uploadProps.file.name }} progress:{{ uploadProps.percentComplete }}%
        </div>
      </div>

    </template>
    <template v-slot:detail>
      <table class="w3-table">
        <tr>
          <th>File</th>
          <th>Size</th>
          <th>Modified</th>
          <th>&nbsp;</th>
        </tr>
        <tr
          v-for="(image, index) in images"
          :key="image.name"
        >
          <td>{{ image.name }}</td>
          <td>{{ image.size }}</td>
          <td>{{ image.mtime }}</td>
          <td class="w3-right">
            <i
              class="w3-button fa fa-trash w3-right w3-small"
              title="Delete"
              @click="deleteImage(index, image.name)"
            ></i>
          </td>
        </tr>
      </table>
    </template>
  </accordian-component>

  <accordian-component
    v-for="sensor in sensors"
    v-bind:key="sensor.deviceId"
  >
    <template v-slot:label>{{ sensor.deviceId }}</template>
    <template v-slot:control-bar-items>
      <div class="w3-bar-item">
        <div class="box-item-aligned">
          Version: {{ sensor.primaryFirmware }}
        </div>
      </div>

      <div
        v-if="upgradeStatus[sensor.deviceId]"
        class="w3-bar-item"
      >
        <div
          v-if="upgradeStatus[sensor.deviceId].status === 'ready' && images.length"
          class="w3-dropdown-hover w3-black"
        >
          <button class="w3-button">Upgrade <i class="fa fa-level-up"></i></button>
          <div
            class="w3-dropdown-content w3-bar-block"
            style="right:0"
          >
            <button
              v-for="image in images"
              :key="image.name"
              class="w3-bar-item w3-button"
              @click="onSensorImageUpgrade(sensor.deviceId, image.name)"
            >{{ image.name }}
            </button>
          </div>
        </div>

        <div v-else>
          <div
            v-for="(msg, index) in upgradeStatus[sensor.deviceId].messages"
            :key="msg"
          >
            {{ msg }}
            &nbsp;&nbsp;
            <i :class="{
              'fa fa-spinner w3-right fa-pulse': index === upgradeStatus[sensor.deviceId].messages.length - 1,
              'fa fa-check w3-right': index < upgradeStatus[sensor.deviceId].messages.length - 1
            }"></i>
            <!--            <i-->
            <!--              v-if="index === upgradeStatus[sensor.deviceId].messages.length - 1"-->
            <!--              class="fa fa-spinner fa-pulse w3-right"-->
            <!--            ></i>-->
          </div>
        </div>

      </div>

    </template>
    <template v-slot:detail>
      <table>
        <tr
          v-for="key in sensorPropKeys"
          :key="key"
        >
          <td>{{ key }}</td>
          <td>{{ sensor[key] }}</td>
        </tr>
      </table>
    </template>
  </accordian-component>

  <!-- UPLOAD MODAL -->
  <Modal
    v-if="uploadProps.state === 'select'"
    @cancel="onCancelUpload()"
    @ok="onConfirmUpload()"
  >
    <template v-slot:label>
      Select the Firmware File
    </template>
    <template v-slot:content>
      <input
        type="file"
        @change="setUploadFiles"
      />
    </template>
  </Modal>

</template>

<script>
import axios from "axios";
import AccordianComponent from "@/components/AccordianComponent.vue";
import Modal from "@/components/Modal.vue";
import PageHeader from "@/components/PageHeader.vue";
import Utils from "@/utils";

export default {
  name: "FirmwareCompent",
  components: {
    AccordianComponent,
    Modal,
    PageHeader,
  },
  data() {
    return {
      pageErrors: [],
      accordionDetail: false,
      images: [],
      pollingInterval: 5000,
      pollingHandle: null,
      behaviorIds: [],
      rebootingIds: [],
      sensors: [],
      uploadProps: {
        state: "inactive",
        file: null,
        percentComplete: 0,
      },
      // states pending, verifying, installing, successful, rebooting, complete
      upgradeStatus: {},
      sensorPropKeys: [
        "primaryFirmware",
        "secondaryFirmware",
        "scmRevision",
        "buildDate",
        "buildPlan",
        "devBuild",
      ],
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
      this.getImages();
      this.getSensorsInfo();
      this.getSensorsUpgrade();
    },
    startPolling() {
      this.pollingHandle = setInterval(
        this.checkOnUpgrades,
        this.pollingInterval
      );
    },
    stopPolling() {
      if (this.pollingHandle == null) {
        return;
      }
      clearInterval(this.pollingHandle);
      this.pollingHandle = null;
    },
    checkOnUpgrades() {
      const ids = [];
      for (const deviceId of Object.keys(this.upgradeStatus)) {
        if (this.upgradeStatus[deviceId].status !== "ready") {
          ids.push(deviceId);
        }
      }
      if (ids.length) {
        this.getSensorsUpgrade(ids);
      }
    },
    async getImages() {
      if (!this.$store.state.auth.loggedIn) {
        return;
      }
      try {
        const rsp = await axios.get("/firmware/images");
        if (!rsp || !rsp.data) {
          throw new Error()
        }
        this.images = rsp.data;
      } catch (err) {
        Utils.responseErrorChain(err, this.pageErrors);
      }
    },
    getSensorsInfo() {
      if (!this.$store.state.auth.loggedIn) {
        return;
      }
      axios
      .get("/firmware/sensors/info")
      .then((rsp) => {
        if (!rsp || !rsp.data) {
          throw new Error()
        }
        this.sensors = rsp.data.sort(Utils.sortSensorById);
      })
      .catch((err) => {
        Utils.responseErrorChain(err, this.pageErrors);
      });
    },
    getSensorsUpgrade(deviceIds) {
      if (!this.$store.state.auth.loggedIn) {
        return;
      }
      let p = {};
      if (deviceIds) {
        p = {params: {deviceIds: deviceIds}};
      }
      axios
      .get("/firmware/sensors/upgrade", p)
      .then((rsp) => {
        if (!rsp || !rsp.data) {
          throw new Error()
        }
        const rebootIds = [];
        let shouldGetInfo = false;

        for (const sensor of rsp.data) {
          const id = sensor.deviceId;
          if (!this.upgradeStatus[id]) {
            // default to ready, even if this first time
            // the status is something else, it will get
            // adjusted in the state transition logic
            this.upgradeStatus[id] = {};
            this.upgradeStatus[id].status = "ready";
            this.upgradeStatus[id].messages = [];
          }
          if (sensor.status === this.upgradeStatus[id].status) {
            continue;
          }

          const curStatus = this.upgradeStatus[id].status;
          let upgradeMsg = "";
          switch (sensor.status) {
            case "failed":
              upgradeMsg = "Upgrade failed";
              rebootIds.push(sensor.deviceId);
              break;
            case "successful":
              upgradeMsg = "Upgrade successful";
              rebootIds.push(sensor.deviceId);
              break;
            case "ready":
              if (curStatus === "pending") {
                // this first case is when the upgrade hasn't been
                // completely initiated, race condition in the sensor status
                // and preempt updating the status back to 'ready'.
                continue;
              } else if (curStatus === "rebooting") {
                // if the sensor is rebooting and now
                // returns as ready, then need to fetch the info
                // so that the firmware info will be updated
                shouldGetInfo = true;
                this.upgradeStatus[sensor.deviceId].messages = [];
              } else {
                console.error(
                  "unexpected upgrade status transition from " +
                  curStatus +
                  " to " +
                  sensor.status
                );
              }
              upgradeMsg = sensor.message;
              break;
            default:
              upgradeMsg = sensor.message;
              break;
          }
          this.upgradeStatus[sensor.deviceId].status = sensor.status;
          this.upgradeStatus[sensor.deviceId].messages.push(upgradeMsg);
        }

        if (shouldGetInfo) {
          this.getSensorsInfo();
        }
        for (const deviceId of rebootIds) {
          this.reboot(deviceId);
        }
      })
      .catch((err) => {
        Utils.responseErrorChain(err, this.pageErrors);
      });
    },
    onSensorImageUpgrade(deviceId, imageName) {
      const answer = window.confirm(
        "Upgrade " + deviceId + " with " + imageName + "?"
      );
      if (!answer) return;

      let params = {
        deviceIds: [deviceId],
        filename: imageName,
      };

      axios
      .post("/firmware/sensors/upgrade", params)
      .then(() => {
        this.upgradeStatus[deviceId].status = "pending";
        this.upgradeStatus[deviceId].messages.push("Sending upgrade request");
      })
      .catch((err) => {
        this.pageErrors.push(
          "error sending firmware upgrade request to " +
          deviceId +
          " " +
          err.message
        );
        this.upgradeStatus[deviceId].status = "ready";
        this.upgradeStatus[deviceId].messages.push(
          "Reset to ready from error"
        );
      });
    },
    onUpload() {
      this.uploadProps.state = "select";
    },
    setUploadFiles(event) {
      if (event.target.files[0]) {
        this.uploadProps.file = event.target.files[0];
      }
    },
    onCancelUpload() {
      this.uploadProps.state = "inactive";
    },
    onConfirmUpload() {
      if (!this.uploadProps.file) {
        this.uploadProps.state = "inactive";
        return;
      }
      this.uploadProps.state = "progress";
      this.uploadProps.percentComplete = 0;
      let config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: progressEvent => {
          this.uploadProps.percentComplete = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
        },
      };
      let formData = new FormData();
      formData.append("file", this.uploadProps.file);
      axios
      .post("/firmware/images", formData, config)
      .then(() => {
        this.uploadProps.file = null;
        this.uploadProps.state = "inactive";
        this.getImages();
      })
      .catch((err) => {
        Utils.responseErrorChain(err, this.pageErrors);
        this.uploadProps.file = null;
        this.uploadProps.state = "inactive";
      });
    },
    deleteImage(index, imageName) {
      const answer = window.confirm(
        "Do you really want to delete: '" + imageName + "'?"
      );
      if (!answer) return false;
      axios
      .delete("/firmware/images", {data: {filename: imageName}})
      .then(() => {
        this.images.splice(index, 1);
      })
      .catch((err) => {
        this.pageErrors.push(
          "error deleting" + imageName + " " + err.message
        );
      });
    },
    reboot(deviceId) {
      if (!this.$store.state.auth.loggedIn) {
        return;
      }
      const path = "/sensors/" + deviceId + "/reboot";
      axios
      .put(path, {command: "reboot"})
      .catch((err) => {
        this.pageErrors.push(
          "error rebooting sensor " + deviceId + " " + err.message
        );
        this.upgradeStatus[deviceId].status = "rebootFailed";
        this.upgradeStatus[deviceId].messages.push("Reboot failed");
      })
      .then(() => {
        this.upgradeStatus[deviceId].status = "rebooting";
        this.upgradeStatus[deviceId].messages.push("Rebooting");
      });
    },
  },
};
</script>

<style scoped>
.box-item-aligned {
  border: none;
  display: inline-block;
  padding: 8px 16px;
  vertical-align: middle;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  background-color: inherit;
  text-align: center;
  white-space: nowrap;
}
</style>
