<!--
#Copyright (C) 2022 Intel Corporation
# SPDX-License-Identifier: BSD-3-Clause

  - Copyright (C) 2022 Intel Corporation
  - SPDX-License-Identifier: BSD-3-Clause
  -->  -->

<template>

  <authentication />

  <div class="w3-cell-row">

    <div class="w3-cell w3-cell-bottom w3-large">

      <div class="w3-bar-block w3-dropdown-hover w3-black">
        <button class="w3-button"><i class="fa fa-bars w3-xlarge"></i></button>
        <div class="w3-dropdown-content" style="min-width: 240px">
          <router-link
            v-for="link in links"
            :key="link.label"
            :to="link.path"
            class="w3-bar-item w3-button w3-large"
          >{{link.label}}</router-link>
          <button
            v-if="isLoggedIn"
            class="w3-bar-item w3-button w3-large"
            @click="onLogout"
          >Log Out</button>
        </div>
      </div>
      <span class="w3-xxlarge">
        {{ this.$route.name }}
      </span>

      <slot name="left-content">&nbsp;</slot>

    </div>

    <div class="w3-cell w3-cell-bottom w3-center">
      <slot name="center-content">&nbsp;</slot>
    </div>

    <div class="w3-cell w3-cell-bottom">
      <slot name="right-content">&nbsp;</slot>
    </div>
  </div>

  <div
    v-for="(msg, idx) in pageErrors"
    :key="idx"
    class="w3-bar w3-border w3-border-red"
  >
    <button
      class="w3-button w3-bar-item"
      title="Viewed"
      @click="this.$emit('viewed', idx)"
    >
      <i class="fa fa-eye-slash"></i>
    </button>
    <div class="w3-bar-item">{{ msg }}</div>
  </div>

</template>
<script>
import Authentication from "@/components/Authentication.vue";
export default {
  props: {
    pageErrors: Array,
  },
  emits: ["viewed"],
  components: {
    Authentication,
  },
  computed: {
    isLoggedIn() {
      return this.$store.state.auth.loggedIn
    }
  },
  data() {
    return {
      links: [
        { label: "Behaviors", path: "/behaviors" },
        { label: "Sensor > Control", path: "/sensor/control" },
        { label: "Sensor > Config", path: "/sensor/config" },
        { label: "Sensor > Firmware", path: "/sensor/firmware" },
        { label: "Tags", path: "/tags" },
        { label: "Events", path: "/events" },
      ],
    };
  },
  methods: {
    onLogout() {
      this.$store.dispatch("auth/logout");
    },
  },
};
</script>

