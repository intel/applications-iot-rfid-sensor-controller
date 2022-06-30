/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

const router = require('express').Router();
const controller = require('./controller');

router.post('/login', controller.logIn);

module.exports = router;
