<!--
  - Copyright (C) 2022 Intel Corporation
  - SPDX-License-Identifier: BSD-3-Clause
  -->

<template>

  <transition name="slide">
    <div
      v-if="!isLoggedIn"
      class="w3-panel w3-white"
      @keyup.enter='onLogin'
    >
      <h2>Authentication Required</h2>
      <h4><em>{{ errorMsg }}</em></h4>
      <label>
        <b>Password</b>&nbsp;&nbsp;
        <i class="fa w3-large" :class="[pwEyeIcon]" @click="hidePassword = !hidePassword"></i>
      </label>
      <input
        class="w3-input w3-border"
        :type="pwFieldType"
        v-model="userPassword"
        placeholder="Enter Password"
        ref="userPasswordField"
        autofocus
      >
      <button
        class="w3-button w3-dark-grey w3-margin-bottom"
        @click='onLogin'
      >
        Login
      </button>
      <div>
        <label>
          <b>App Controller Base URL</b>
        </label>
        <input
            type="Text"
            :value="baseURL"
            class="w3-input w3-border w3-margin-bottom"
            @change="onBaseURLUpdate($event.target.value)"
        />
      </div>
    </div>
  </transition>
</template>

<script>
import axios from "axios";

export default {
  name: "AuthenticationComponent",
  mounted() {
    console.log('auth mounted');
    this.baseURL = axios.defaults.baseURL;
  },
  data() {
    return {
      errorMsg: "",
      userPassword: "",
      hidePassword: true,
      baseURL: axios.defaults.baseURL
    };
  },
  computed: {
    pwEyeIcon() {
      return this.hidePassword ? "fa-eye" : "fa-eye-slash"
    },
    pwFieldType() {
      return this.hidePassword ? "password" : "text"
    },
    isLoggedIn() {
      return this.$store.state.auth.loggedIn
    }
  },
  watch: {
    isLoggedIn(newVal)  {
      if(!newVal) {
        this.$nextTick(() => {
          let e = this.$refs["userPasswordField"]
          e.focus()
          e.select()
        })
      }
    }
  },
  methods: {
    onLogin() {
      this.$store
      .dispatch("auth/login", this.userPassword)
      .then(
        () => {
          this.userPassword = '';
          this.errorMsg = '';
        },
        (err) => {
          let msg = '';
          if (err.response) {
            switch (err.response.status) {
              case 401:
                msg += "Unauthorized";
                break
              case 404:
                msg += "Not Found";
                break
            }
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            if (err.response.data) {
              // the app should respond with json format and property of 'message'
              if (err.response.data.message) {
                msg += `: ${err.response.data.message}`;
              } else {
                msg += `: ${JSON.stringify(err.response.data)}`;
              }
            } else {
              msg += `: ${err.message}`;
            }
          } else {
            msg += 'Network Error: lost connection, try reloading the page'
          }
          this.errorMsg = msg;
        }
      );
    },
    onBaseURLUpdate(updatedValue) {
      this.baseURL = updatedValue;

      console.debug(axios.defaults.baseURL);
      try {
        console.log(`saving baseUrl ${updatedValue}`)
        localStorage.setItem('baseUrl', updatedValue);
      } catch (err) {
        // don't care just don't blow up
      }
    },
  },
};
</script>
