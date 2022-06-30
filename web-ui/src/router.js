/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

import { createRouter, createWebHistory } from "vue-router";
import Behaviors from "@/behaviors/Behaviors";
import SensorControl from "@/sensor/control/Sensors";
import SensorConfig from "@/sensor/config/Sensors";
import SensorFirmware from "@/sensor/firmware/Firmware";
import Tags from "@/tags/Tags";
import Events from "@/events/Events"

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/behaviors'
    },
    {
      path: "/behaviors",
      name: "Behaviors",
      component: Behaviors
    },
    {
      path: "/sensor/control",
      name: "Sensor Control",
      component: SensorControl
    },
    {
      path: "/sensor/config",
      name: "Sensor Config",
      component: SensorConfig
    },
    {
      path: "/sensor/firmware",
      name: "Sensor Firmware",
      component: SensorFirmware
    },
    {
      path: "/tags",
      name: "Tags",
      component: Tags
    },
    {
      path: "/events",
      name: "Events",
      component: Events
    },
  ]
});

export default router;
