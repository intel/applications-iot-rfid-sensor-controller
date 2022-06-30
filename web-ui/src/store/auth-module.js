/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

import axios from "axios";

export default {
  namespaced: true,
  state: () => ({
    loggedIn: false,
  }),
  actions: {
    login({ commit }, password) {
      return axios
        .post("/auth/login", { password: password })
        .then(
          rsp => {
            if (rsp.data) {
              axios.defaults.headers.common['Authorization'] = `Bearer ${rsp.data.token}`;
              commit('loginSuccess');
              return Promise.resolve(rsp.data);
            } else {
              throw new Error("missing login response data")
            }
          },
          err => {
            axios.defaults.headers.common['Authorization'] = '';
            commit('loginFailure');
            return Promise.reject(err);
          }
        );
    },
    logout({ commit }) {
      axios.defaults.headers.common['Authorization'] = '';
      commit('logout');
    },
  },
  mutations: {
    loginSuccess(state) {
      state.loggedIn = true;
    },
    loginFailure(state) {
      state.loggedIn = false;
    },
    logout(state) {
      state.loggedIn = false;
    },
  }
}
