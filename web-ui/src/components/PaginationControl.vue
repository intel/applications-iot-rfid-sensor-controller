<!--
  - Copyright (C) 2022 Intel Corporation
  - SPDX-License-Identifier: BSD-3-Clause
  -->

<template>
  <div>
    Items per Page
    <select
      :value="this.pageProps.limit"
      @change="updateLimit($event.target.value)"
    >
      <option
        v-for="item in itemsPerPageOptions"
        :value="item.value"
        :key="item.value"
      >
        {{ item.text }}
      </option>
    </select>
  </div>
  <div>
    <button
      @click="first"
      class="w3-button"
      :disabled="firstDisabled"
    >
      <i class="fa fa-angle-double-left"></i>
    </button>

    <button
      @click="previous"
      class="w3-button"
      :disabled="previousDisabled"
    >
      <i class="fa fa-angle-left"></i>
    </button>

    <span>Page {{ currentPage }} of {{ totalPages }}</span>

    <button
      @click="next"
      class="w3-button"
      :disabled="nextDisabled"
    >
      <i class="fa fa-angle-right"></i>
    </button>

    <button
      @click="last"
      class="w3-button"
      :disabled="lastDisabled"
    >
      <i class="fa fa-angle-double-right"></i>
    </button>
  </div>
</template>
<script>
export default {
  props: {
    pageProps: {
      offset: { type: Number},
      limit: { type: Number},
      count: { type: Number},
      required: true,
    },
  },
  emits: ["limit", "query"],
  computed: {
    totalPages() {
      return Math.ceil(this.pageProps.count / this.pageProps.limit);
    },
    firstDisabled() {
      return false;
    },
    lastDisabled() {
      return false;
    },
    previousDisabled() {
      return false;
    },
    nextDisabled() {
      return false;
    },
    currentPage() {
      return this.pageProps.offset / this.pageProps.limit + 1;
    },
    itemsPerPageOptions() {
      return [
        { value: 20, text: "20" },
        { value: 50, text: "50" },
        { value: 100, text: "100" },
        { value: this.pageProps.count, text: "All" },
      ];
    },
  },
  data() {
    return {};
  },
  methods: {
    updateLimit(newLimit) {
      // calculate a new offset that should inculde the current
      // offset in the record set
      const offset = Math.floor(this.pageProps.offset / newLimit) * newLimit;
      this.$emit("query", offset, newLimit);
    },
    first() {
      this.$emit("query", 0, this.pageProps.limit);
    },
    last() {
      const offset =
        Math.floor(this.pageProps.count / this.pageProps.limit) *
        this.pageProps.limit;
      this.$emit("query", offset, this.pageProps.limit);
    },
    previous() {
      const offset = Math.max(this.pageProps.offset - this.pageProps.limit, 0);
      this.$emit("query", offset, this.pageProps.limit);
    },
    next() {
      const offset = Math.min(
        parseInt(this.pageProps.offset) + parseInt(this.pageProps.limit),
        this.lastOffset()
      );
      this.$emit("query", offset, this.pageProps.limit);
    },
    lastOffset() {
      return (
        Math.floor(this.pageProps.count / this.pageProps.limit) *
        this.pageProps.limit
      );
    },
  },
};
</script>
