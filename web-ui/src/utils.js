/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

export default {
  pushSequentialArrayObj(parent, key, obj, sequentialKey) {
    if (!parent[key]) {
      parent[key] = [];
    }
    parent[key].push(obj);
    this.setLastToMax(parent[key], sequentialKey);
  },
  setLastToGap(arr, key, iniVal, maxVal) {
    let i;
    if (!key) { return; }
    if (arr.length < 2) { return; }
    const lastIndex = arr.length - 1;
    const existing = [];
    for (i = 0; i < lastIndex; i++) {
      existing.push(arr[i][key]);
    }
    for (i = iniVal; i <= maxVal; i++) {
      if (!existing.includes(i)) {
        arr[lastIndex][key] = i;
        break;
      }
    }
  },
  setLastToMax(a, key) {
    if (!key) { return; }
    if (a.length < 2) { return; }
    let max = 0;
    let i = 0;
    for (; i < a.length - 1; i++) {
      max = Math.max(max, a[i][key]);
    }
    if (a[i][key] <= max) {
      a[i][key] = +max + 1;
    }
  },
  removeArrayObj(parent, key, index) {
    if (!parent[key]) {
      return;
    }
    parent[key].splice(index, 1);
    if (parent[key].length === 0) {
      delete parent[key];
    }
  },
  ensureHex(value) {
    return value.replace(/[^A-Fa-f0-9]/g, "").toUpperCase();
  },
  validateHex8(value) {
    value = value.slice(0, 8);
    value = this.ensureHex(value);
    return value;
  },
  validateHex12(value) {
    value = value.slice(0, 12);
    value = this.ensureHex(value);
    return value;
  },
  objectsEqual(o1, o2) {
    const keys1 = Object.keys(o1);
    const keys2 = Object.keys(o2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      if (o1[key] !== o2[key]) {
        if (typeof o1[key] == "object" && typeof o2[key] == "object") {
          if (!this.objectsEqual(o1[key], o2[key])) {
            return false;
          }
        } else {
          return false;
        }
      }
    }

    return true;
  },
  download(name, jsonObj) {
    const data = JSON.stringify(jsonObj, null, 2);
    const a = document.createElement("a");
    a.download = name + ".json";
    a.href = window.URL.createObjectURL(
      new Blob([data], { type: "text/plain" })
    );
    a.dataset.downloadurl = ["text/json", a.download, a.href].join(":");
    a.dispatchEvent(
      new MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: false,
      })
    );
    URL.revokeObjectURL(a.href);
  },
  sortSensorById(a, b) {
    return a.deviceId > b.deviceId
      ? 1
      : a.deviceId < b.deviceId
        ? -1
        : 0;
  },
  responseErrorChain(err, messages) {
    if (this.errorIs401(err)) {
      return;
    }
    let m = err.message;
    if (err.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (err.response.data) {
        // the app should respond with json format and property of 'message'
        if (err.response.data.message) {
          m += ": " + err.response.data.message;
        } else {
          m += ` ${JSON.stringify(err.response.data)}`
        }
      } else {
        m += ": " + err.response.status + ": " + err.response.statusText;
      }
    } else {
      // if there is no response defined, it might be CORS, or network, or server went down
      // which causes CORS preflight to fail when refreshing once the vue app is loaded already.
      m += 'Network Error: lost connection, try reloading the page'
    }
    const i = messages.findIndex(el => el === m);
    if(i < 0) {
      messages.push(m);
    }
  },
  errorIs401(err) {
    return err.response && err.response.status === 401
  }

}
