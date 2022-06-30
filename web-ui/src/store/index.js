/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

import {createStore} from 'vuex'
import auth from './auth-module'

export default createStore({
  modules: {
    auth
  }
})

