<!--
  - Copyright (C) 2022 Intel Corporation
  - SPDX-License-Identifier: BSD-3-Clause
  -->

<template>
  <span v-if="sort.col===id">
    <i
      v-if="sort.dir==='DESC'"
      class="fa fa-sort-down"
    />
    <i
      v-if="sort.dir==='ASC'"
      class="fa fa-sort-up"
    />
  </span>
</template>
<script>
export default {
  props: {
    id: String,
    sort: Object,
  },
};
</script>
