<!--
  - Copyright (C) 2022 Intel Corporation
  - SPDX-License-Identifier: BSD-3-Clause
  -->

<template>
  <div
    class="w3-button"
    title="Upload"
    @click="onUpload"
  >
    <i class="fa fa-upload"></i>
  </div>

  <!-- UPLOAD MODAL -->
  <Modal
    v-if="uploadProps.visible"
    @cancel="uploadProps.visible=false"
    @ok="onConfirmUpload()"
  >
    <template v-slot:label>
      Select the Json File
    </template>
    <template v-slot:content>
      <input
        type="file"
        @change="setUploadFiles"
        multiple
      />
    </template>
  </Modal>

</template>

<script>
import axios from "axios";
import Modal from "@/components/Modal.vue";

export default {
  name: "JsonFileUpload",
  props: {
    validationCallback: Function,
    pathCallback: Function,
    successCallback: Function,
    failCallback: Function,
  },
  components: {
    Modal,
  },
  data() {
    return {
      uploadProps: {
        visible: false,
        files: [],
      },
    };
  },
  methods: {
    onUpload() {
      this.uploadProps.visible = true;
    },
    setUploadFiles(event) {
      this.uploadProps.files = event.target.files;
    },
    onConfirmUpload() {
      this.uploadProps.visible = false;
      const total = this.uploadProps.files.length;

      for (let i = 0; i < total; i++) {
        const jsonFile = this.uploadProps.files[i];
        let reader = new FileReader();
        reader.onload = (event) => {
          let jsonObj = JSON.parse(event.target.result.toString());
          if (Array.isArray(jsonObj)) {
            for (const s of jsonObj) {
              if (this.validate(s)) {
                this.upload(s);
              }
            }
          } else {
            if (this.validate(jsonObj)) {
              this.upload(jsonObj);
            }
          }
        };
        reader.onerror = (event) => {
          console.error(event);
        };
        reader.readAsText(jsonFile, "UTF-8");
      }
    },
    validate(jsonObj) {
      if (this.validationCallback) {
        return this.validationCallback(jsonObj);
      }
      return true;
    },
    upload(jsonObj) {
      axios
        .post(this.pathCallback(jsonObj), jsonObj)
        .then((rsp) => {
          if (!rsp || !rsp.data) { throw new Error() }
          if (this.successCallback) {
            this.successCallback(jsonObj, rsp);
          }
        })
        .catch((err) => {
          if (this.failCallback) {
            this.failCallback(jsonObj, err);
          } else {
            console.error(err.message);
          }
        });
    },
  },
};
</script>
