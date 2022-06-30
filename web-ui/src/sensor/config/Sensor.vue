<!--
  - Copyright (C) 2022 Intel Corporation
  - SPDX-License-Identifier: BSD-3-Clause
  -->

<template>
  <accordian-component>
    <template v-slot:label>{{ local.deviceId }}</template>
    <template v-slot:control-bar-items>
      <div
        class="w3-bar-item w3-button"
        :class="{ 'w3-disabled': !modified }"
        title="Save"
        @click="saveIfValid"
      >
        <i class="fa fa-save"></i>
      </div>
      <div
        class="w3-bar-item w3-button"
        title="Download"
        @click="onDownload"
      >
        <i class="fa fa-download"></i>
      </div>
      <div
        class="w3-bar-item w3-button"
        title="Copy"
        @click="this.$emit('copy', this.local)"
      >
        <i class="fa fa-copy"></i>
      </div>
      <div
        class="w3-bar-item w3-button"
        title="Delete"
        @click="this.$emit('delete', this.local)"
      >
        <i class="fa fa-trash"></i>
      </div>
    </template>

    <template v-slot:detail>
      <table class="w3-table">
        <tr>
          <th>Ip Address</th>
          <td>{{local.ip4Address}}</td>
          <td></td>
          <td></td>
          <td></td>
        </tr>

        <tr>
          <th>Behavior</th>
          <td>
            <select
              :value="local.behaviorId"
              @change="updateBehaviorId($event.target.value)"
              :class="{'w3-border-red': validations.behaviorId}"
            >
              <option
                v-if="!behaviorIds.includes(local.behaviorId)"
                :value="local.behaviorId"
                :key="local.behaviorId"
              >
                {{ local.behaviorId }}
              </option>

              <option
                v-for="item in behaviorIds"
                :value="item"
                :key="item"
              >
                {{ item }}
              </option>
            </select>
            <div v-if="validations.behaviorId">
              This behavior has not been configured.<br>
              Please select different
            </div>

          </td>
          <td></td>
          <td></td>
          <td></td>
        </tr>
        <tr>
          <th>
            Antennas
            <span class="w3-right">
              <button
                class="w3-tiny"
                @click="addAntenna()"
                title="Add an antenna port configuration"
              >
                <i class="fa fa-plus"></i>
              </button>
            </span>
          </th>
          <th>Port</th>
          <th>Name</th>
          <th>Facility</th>
          <th>Personality</th>
        </tr>

        <tr
          v-for="(antenna, i) in local.antennaPorts"
          v-bind:key="i"
        >
          <th>
            <span class="w3-right">
              <button
                class="w3-tiny"
                @click="removeAntenna(i)"
                title="Remove this antenna port configuration"
              >
                <i class="fa fa-minus"></i>
              </button>
            </span>
          </th>

          <td>

            <input
              type="Number"
              placeholder="Antenna Port"
              :value="antenna.antennaPort"
              @change="update(i, 'antennaPort', parseInt($event.target.value))"
              min=1
              max=64
              step=1
              :class="{'w3-border-red': validations.portsInUse[i] || validations.portsValue[i]}"
            />
            <div v-if="validations.portsValue[i]">
              Must be between 1 and 64
            </div>
            <div v-if="validations.portsInUse[i]">
              Already in use
            </div>
          </td>
          <td>
            <input
              type="Text"
              placeholder="Antenna Name"
              :value="antenna.antennaName"
              @change="update(i, 'antennaName', $event.target.value)"
              maxlength=64
              :class="{'w3-border-red': validations.names[i]}"
            />
            <div v-if="validations.names[i]">
              Max length - 64 characters<br>No spaces
            </div>
          </td>

          <td>
            <input
              type="Text"
              placeholder="Facility Id"
              :value="antenna.facilityId"
              @change="update(i, 'facilityId', $event.target.value)"
              maxlength=64
              :class="{'w3-border-red': validations.facilityIds[i]}"
            />
            <div v-if="validations.facilityIds[i]">
              Max length - 64 characters<br>No spaces
            </div>
          </td>

          <td>
            <select
              :value="antenna.personality"
              @change="update(i, 'personality', $event.target.value)"
              :class="{'w3-border-red': validations.personalities[i]}"
            >
              <option
                v-for="item in personalityOpts"
                :value="item.value"
                :key="item.value"
              >
                {{ item.text }}
              </option>
            </select>
          </td>

        </tr>

      </table>
    </template>

  </accordian-component>
</template>

<script>
import { cloneDeep, isEqual } from "lodash";
import AccordianComponent from "@/components/AccordianComponent.vue";
import Utils from "@/utils";

export default {
  name: "SensorConfigComponent",
  components: {
    AccordianComponent,
  },
  emits: ["copy", "save", "delete", "modified"],
  props: {
    sensor: {
      type: Object,
      required: true,
    },
    behaviorIds: {
      type: Array,
      required: true,
    },
  },
  watch: {
    // this aligns values from parent when that model is changed
    // and also disables the save button until something is modified
    sensor(newValue) {
      this.local = cloneDeep(newValue);
      this.original = newValue;
      this.modified = false;
    },
  },
  data() {
    return {
      local: cloneDeep(this.sensor),
      original: this.sensor,
      modified: false,
      validations: {
        behaviorId: "",
        portsInUse: [],
        portsValue: [],
        names: [],
        facilityIds: [],
        personalities: [],
      },
      personalityOpts: [
        { value: "none", text: "None" },
        { value: "pos", text: "Point of Sale" },
        { value: "exit", text: "Exit" },
      ],
    };
  },
  methods: {
    onDownload() {
      Utils.download(this.local.deviceId, this.local);
    },
    update(index, prop, val) {
      this.local.antennaPorts[index][prop] = val;
      if (this.validate()) {
        this.checkForSave();
      }
    },
    updateBehaviorId(val) {
      this.local.behaviorId = val;
      if (this.validate()) {
        this.checkForSave();
      }
    },
    newAntenna() {
      return {
        antennaPort: 1,
        antennaName: "",
        facilityId: "",
        personality: this.personalityOpts[0].value,
      };
    },
    addAntenna() {
      if (this.local.antennaPorts.length >= 64) {
        alert("Max number of ports is 64");
        return;
      }
      this.local.antennaPorts.push(this.newAntenna());
      Utils.setLastToGap(this.local.antennaPorts, "antennaPort", 1, 64);
      this.checkForSave();
    },
    removeAntenna(index) {
      if (this.local.antennaPorts.length < 2) {
        alert("Must keep at least 1 antenna port configuration");
        return;
      }
      this.local.antennaPorts.splice(index, 1);
      this.checkForSave();
    },
    validate() {
      let isValid = true;

      if (!this.behaviorIds.includes(this.local.behaviorId)) {
        this.validations.behaviorId = true;
        isValid = false;
      } else {
        this.validations.behaviorId = false;
      }

      let val = "";
      const existing = [];
      for (let i = 0; i < this.local.antennaPorts.length; i++) {
        const antenna = this.local.antennaPorts[i];

        val = antenna.antennaPort;
        if (existing.includes(val)) {
          this.validations.portsInUse[i] = true;
          isValid = false;
        } else {
          this.validations.portsInUse[i] = false;
        }
        existing.push(antenna.antennaPort);

        if (val < 1 || val > 64) {
          this.validations.portsValue[i] = true;
          isValid = false;
        } else {
          this.validations.portsValue[i] = false;
        }

        val = antenna.antennaName;
        if (val.length > 64 || !/^\S*$/.test(val)) {
          this.validations.names[i] = true;
          isValid = false;
        } else {
          this.validations.names[i] = false;
        }

        val = antenna.facilityId;
        if (val.length > 64 || !/^\S*$/.test(val)) {
          this.validations.facilityIds[i] = true;
          isValid = false;
        } else {
          this.validations.facilityIds[i] = false;
        }
      }

      return isValid;
    },
    saveIfValid() {
      if (!this.modified) {
        return;
      }
      if (!this.validate()) {
        alert("Please fix the errors indicated");
        return;
      }
      this.$emit("save", this.local);
    },
    checkForSave() {
      this.modified = !isEqual(this.original, this.local);
      this.$emit("modified", this.modified);
    },
  },
};
</script>
