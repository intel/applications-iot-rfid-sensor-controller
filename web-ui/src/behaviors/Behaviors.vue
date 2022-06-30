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
              title="New Behavior"
              @click="onNewBehavior"
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
              @click="onDownload()"
            >
              <i class="fa fa-download"></i>
            </div>
          </td>
        </tr>
      </table>
    </template>
  </page-header>

  <div v-if="!loading && (!behaviors || behaviors.length <= 0)">
    <div class="w3-container">
      <div v-if="loggedIn">
        No behaviors present. Create a new behavior by clicking on the plus button or uploading a JSON file.
      </div>
    </div>
  </div>

  <div v-if="behaviors">

    <!-- COPY MODAL -->
    <Modal
      v-if="copyProps.visible"
      @cancel="copyProps.visible=false"
      @ok="confirmCopy()"
    >
      <template v-slot:label>
        Please Enter a New Behavior Id
      </template>
      <template v-slot:content>
        <input
          type="text"
          placeholder="New Behavior Id"
          v-model=copyProps.newId
        />
      </template>
    </Modal>

    <!-- NEW BEHAVIOR MODAL -->
    <Modal
      v-if="newProps.visible"
      @cancel="newProps.visible=false"
      @ok="confirmNewBehavior()"
    >
      <template v-slot:label>
        Please Enter a New Behavior Id
      </template>
      <template v-slot:content>
        <input
          type="text"
          placeholder="New Behavior Id"
          v-model=newProps.newId
        />
      </template>
    </Modal>

    <div
      v-for="(behavior, index) in behaviors"
      :key="behavior.id"
    >
      <behavior
        :behavior="behavior"
        @copy="onCopy($event)"
        @save="save($event)"
        @delete="onDelete(index)"
        @modify="onModification(index, $event)"
      />
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { cloneDeep } from "lodash";
import Behavior from "./Behavior.vue";
import JsonFileUpload from "@/components/JsonFileUpload.vue";
import Modal from "@/components/Modal.vue";
import PageHeader from "@/components/PageHeader.vue";
import Utils from "@/utils";

export default {
  name: "BehaviorsComponent",
  components: {
    Behavior,
    JsonFileUpload,
    Modal,
    PageHeader,
  },
  data() {
    return {
      loading: true,
      pageErrors: [],
      behaviors: null,
      modifications: [],
      newProps: {
        visible: false,
        newId: "",
      },
      copyProps: {
        visible: false,
        behavior: null,
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
      if (val) {
        this.onRefresh();
      }
    },
  },
  computed: {
    loggedIn() {
      return this.$store.state.auth.loggedIn;
    },
  },
  methods: {
    onRefresh() {
      if (this.modifications.some(Boolean)) {
        const answer = window.confirm(
          "Unsaved Changes!! Do you really want to refresh the page?"
        );
        if (!answer) return;
      }
      this.getBehaviors();
    },
    getBehaviors() {
      axios
        .get("/behaviors")
        .then((rsp) => {
          if (!rsp || !rsp.data) { throw new Error() }
          this.behaviors = rsp.data.sort((a, b) => {
            return a.id > b.id ? 1 : a.id < b.id ? -1 : 0;
          });
          this.modifications = new Array(this.behaviors.length).fill(false);
        })
        .catch((err) => {
          Utils.responseErrorChain(err, this.pageErrors);
        })
        .finally(() => (this.loading = false));
    },
    localUpsert(behavior) {
      let i = 0;
      for (; i < this.behaviors.length; i++) {
        if (behavior.id < this.behaviors[i].id) {
          break;
        } else if (behavior.id === this.behaviors[i].id) {
          this.behaviors[i] = cloneDeep(behavior);
          this.modifications[i] = false;
          return;
        }
      }
      this.behaviors.splice(i, 0, behavior);
      this.modifications.splice(i, 0, false);
    },
    save(behavior) {
      axios
        .post("/behaviors/" + behavior.id, behavior)
        .then(() => {
          this.localUpsert(behavior);
        })
        .catch((err) => {
          Utils.responseErrorChain(err, this.pageErrors);
        });
    },
    onNewBehavior() {
      this.newProps.visible = true;
    },
    confirmNewBehavior() {
      let newId = this.newProps.newId;
      if (newId === "") {
        alert("Behavior Id cannot be blank");
        return;
      }
      for (let b of this.behaviors) {
        if (newId === b.id) {
          alert("Behavior Id already exists");
          return;
        }
      }
      this.newProps.visible = false;
      this.save(this.newBehavior(newId));
    },
    newBehavior(id) {
      return {
        id: id,
        preset: {
          eventConfig: {
            common: {
              hostname: "enabled",
            },
            tagInventory: {
              tagReporting: {
                reportingIntervalSeconds: 0,
                tagCacheSize: 2048,
                antennaIdentifier: "antennaPort",
                tagIdentifier: "epc",
              },
              epc: "disabled",
              epcHex: "enabled",
              tid: "disabled",
              tidHex: "enabled",
              antennaPort: "enabled",
              transmitPowerCdbm: "enabled",
              peakRssiCdbm: "enabled",
              frequency: "enabled",
              pc: "disabled",
              lastSeenTime: "enabled",
              phaseAngle: "enabled",
            },
          },
          antennaConfigs: [
            {
              antennaPort: 1,
              transmitPowerCdbm: 1800,
              rfMode: 100,
              inventorySession: 1,
              inventorySearchMode: "single-target",
              estimatedTagPopulation: 1024,
            },
          ],
        },
      };
    },
    onUploadValidate(behavior) {
      if (!behavior.id || behavior.id.trim === "") {
        alert("Behavior id cannot be empty");
        return false;
      }
      return true;
    },
    onUploadPath(behavior) {
      return "/behaviors/" + behavior.id;
    },
    onUploadSuccess(behavior) {
      this.localUpsert(behavior);
    },
    onUploadFail(behavior) {
      this.pageErrors.push("Behavior upload failed for " + behavior.id);
    },
    onDownload() {
      Utils.download("behaviors", this.behaviors);
    },
    onCopy(behavior) {
      this.copyProps.behavior = behavior;
      this.copyProps.visible = true;
      this.copyProps.newId = behavior.id;
    },
    confirmCopy() {
      const newId = this.copyProps.newId.trim();
      if (newId === "") {
        alert("Behavior Id cannot be blank");
        return;
      } else if (newId === this.copyProps.behavior.id) {
        alert("Behavior Id must be different than the original");
        return;
      }
      this.copyProps.visible = false;
      let newBehavior = cloneDeep(this.copyProps.behavior);
      newBehavior.id = newId;
      this.save(newBehavior);
    },
    onDelete(index) {
      let id = this.behaviors[index].id;
      const answer = window.confirm(
        "Do you really want to delete: " + id + "?"
      );
      if (!answer) return false;
      axios
        .delete("/behaviors/" + id)
        .then(() => {
          this.behaviors.splice(index, 1);
          this.modifications.splice(index, 1);
        })
        .catch((err) => {
          Utils.responseErrorChain(err, this.pageErrors);
        });
    },
    onModification(index, val) {
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
