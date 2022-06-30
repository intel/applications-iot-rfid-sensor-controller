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
              title="Refresh"
              @click="onRefresh"
            >
              <i
                class="fa fa-refresh"
                :class="{ 'fa-spin': loading }"
              ></i>
            </div>
          </td>
          <td>
            <div
              class="w3-button"
              title="New Sensor"
              @click="onNewSensor"
            >
              <i class="fa fa-plus"></i>
            </div>
          </td>
          <td>
            <json-file-upload
              :successCallback="onUploadSuccess"
              :failCallback="onUploadFail"
              :validationCallback="onUploadValidate"
              :pathCallback="onUploadPath"
            />
          </td>
          <td>
            <div
              class="w3-button"
              title="Download"
              @click="onDownload"
            >
              <i class="fa fa-download"></i>
            </div>
          </td>
        </tr>
      </table>

    </template>

  </page-header>

  <!-- COPY MODAL -->
  <Modal
    v-if="copyProps.visible"
    @cancel="copyProps.visible=false"
    @ok="confirmCopy()"
  >
    <template v-slot:label>
      Please Enter a New Sensor Id
    </template>
    <template v-slot:content>
      <input
        type="text"
        placeholder="New Sensor Id"
        v-model=copyProps.newId
      />
    </template>
  </Modal>

  <!-- NEW MODAL -->
  <Modal
    v-if="newProps.visible"
    @cancel="newProps.visible=false"
    @ok="confirmNewSensor()"
  >
    <template v-slot:label>
      Please Enter a New Sensor Id
    </template>
    <template v-slot:content>
      <input
        type="text"
        placeholder="New Sensor Id"
        v-model=newProps.newId
      />
    </template>
  </Modal>

  <div
    v-for="(sensor,index) in sensors"
    v-bind:key="sensor.deviceId"
  >
    <sensor
      :behaviorIds="behaviorIds"
      :sensor="sensor"
      @copy="onCopy(index, $event)"
      @save="onSave(index, $event)"
      @delete="onDelete(index, $event)"
      @modified="modified(index, $event)"
    />
  </div>
</template>

<script>
import axios from "axios";
import { cloneDeep } from "lodash";
import JsonFileUpload from "@/components/JsonFileUpload.vue";
import Sensor from "./Sensor.vue";
import Modal from "@/components/Modal.vue";
import PageHeader from "@/components/PageHeader.vue";
import Utils from "@/utils";

export default {
  name: "SensorsConfigCompent",
  components: {
    JsonFileUpload,
    Modal,
    PageHeader,
    Sensor,
  },
  data() {
    return {
      loading: false,
      pageErrors: [],
      behaviorIds: [],
      sensors: [],
      modifications: [],
      newProps: {
        visible: false,
        newId: "",
      },
      copyProps: {
        visible: false,
        sensor: null,
        index: null,
        newId: null,
      },
    };
  },
  mounted() {
    if(this.$store.state.auth.loggedIn) {
      this.onRefresh();
    }
  },
  watch: {
    "$store.state.auth.loggedIn"(val) {
      if(val) {
        this.onRefresh();
      }
    },
  },
  methods: {
    async onRefresh() {
      if (this.modifications.some(Boolean)) {
        const answer = window.confirm(
          "Unsaved Changes!! Refreshing the page data will lose those changes, do you really want to refresh the page?"
        );
        if (!answer) {
          return;
        }
      }

      this.loading = true;
      try {
        let rsp = await axios.get("/behaviors");
        if (!rsp || !rsp.data) { throw new Error() }
        const a = [];
        for (const b of rsp.data) {
          a.push(b.id);
        }
        this.behaviorIds = a.sort();

        rsp = await axios.get("/sensors");
        if (!rsp || !rsp.data) { throw new Error() }
        this.sensors = rsp.data.sort(Utils.sortSensorById);
        this.modifications = new Array(this.sensors.length).fill(false);
      } catch (err) {
        Utils.responseErrorChain(err, this.pageErrors);
      } finally {
        this.loading = false;
      }
    },
    onSave(index, sensor) {
      axios
        .post("/sensors/" + sensor.deviceId, sensor)
        .then(() => {
          this.sensors[index] = sensor;
          this.modifications[index] = false;
        })
        .catch((err) => {
          Utils.responseErrorChain(err, this.pageErrors);
        });
    },
    onNewSensor() {
      this.newProps.visible = true;
    },
    confirmNewSensor() {
      let newId = this.newProps.newId;
      if (newId === "") {
        alert("Sensor Id cannot be blank");
        return;
      }
      for (let b of this.sensors) {
        if (newId === b.deviceId) {
          alert("Sensor Id already exists");
          return;
        }
      }
      this.newProps.visible = false;
      const newSensor = this.newSensor(newId);
      this.onSave(this.sensors.length, newSensor);
    },
    newSensor(id) {
      return {
        deviceId: id,
        ip4Address: "unknown",
        behaviorId: "unknown",
        status: "unknown",
        connected: false,
        antennaPorts: [
          {
            antennaPort: 1,
            antennaName: "",
            facilityId: "",
            personality: "none",
          },
        ],
      };
    },
    onDownload() {
      Utils.download("sensors", this.sensors);
    },
    onUploadValidate(sensor) {
      if (!sensor.deviceId || sensor.deviceId.trim === "") {
        alert("Sensor deviceId cannot be empty");
        return false;
      }
      return true;
    },
    onUploadPath(sensor) {
      return "/sensors/" + sensor.deviceId;
    },
    onUploadSuccess() {
      this.getSensors();
    },
    onUploadFail(sensor) {
      this.pageErrors.push("Sensor upload failed for " + sensor.deviceId);
    },
    onCopy(index, sensor) {
      this.copyProps.sensor = sensor;
      this.copyProps.index = index;
      this.copyProps.visible = true;
      this.copyProps.newId = sensor.deviceId;
    },
    confirmCopy() {
      const newId = this.copyProps.newId.trim();
      if (newId === "") {
        alert("Sensor Id cannot be blank");
        return;
      } else if (newId === this.copyProps.sensor.deviceId) {
        alert("Sensor Id must be different than the original");
        return;
      }
      this.copyProps.visible = false;
      const newSensor = cloneDeep(this.copyProps.sensor);
      newSensor.deviceId = newId;
      newSensor.ip4Address = "unknown";
      this.onSave(this.sensors.length, newSensor);
    },
    onDelete(index, sensor) {
      const answer = window.confirm(
        "Do you really want to delete: " + sensor.deviceId + "?"
      );
      if (!answer) return false;
      axios
        .delete("/sensors/" + sensor.deviceId)
        .then(() => {
          this.sensors.splice(index, 1);
          this.modifications.splice(index, 1);
        })
        .catch((err) => {
          Utils.responseErrorChain(err, this.pageErrors);
        });
    },
    modified(index, val) {
      this.modifications[index] = val;
    },
  },
  beforeRouteLeave() {
    if (this.modifications.some(Boolean)) {
      const answer = window.confirm(
        "Unsaved Changes!! Do you really want to leave the page?"
      );
      if (!answer) return false;
    }
  },
};
</script>
