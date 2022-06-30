/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

import { createApp } from 'vue'
import App from './App.vue'
import store from './store'
import router from './router'

createApp(App)
  .use(store)
  .use(router)
  .mount("#app");

