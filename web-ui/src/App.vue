<!--
  - Copyright (C) 2022 Intel Corporation
  - SPDX-License-Identifier: BSD-3-Clause
  -->

<template>
  <div class="w3-container">
    <router-view />
  </div>
</template>

<script>
import axios from "axios";
import store from './store'
export default {
  name: 'App',
  mounted() {
    let port = '3000';
    if (window.location.protocol === 'https:') {
      port = '3443';
    }
    axios.defaults.baseURL = `${window.location.protocol}//${window.location.hostname}:${port}/api/v01`;

    axios.interceptors.response.use(
      (rsp) => {
        return Promise.resolve(rsp);
      },
      (err) => {
        if (err.response) {
          if ([401].includes(err.response.status)) {
            void store.dispatch("auth/logout");
          }
          return Promise.reject(err);
        }
      }
    );

  },

}
</script>

<style>

html, body {
    font-size: 14px;
    color: #ffffff;
    background-color: #000000;
}

hr {
    size: 1px;
    color: gray;
    margin-top: 10px;
    margin-bottom: 10px;
}

.txt_input_std {
   width: 120px;
}

</style>
