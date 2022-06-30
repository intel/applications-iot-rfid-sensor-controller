/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

const router = require('express').Router();
const controller = require('./controller');

router.get('/', controller.get);
router.post('/', controller.upsert);

module.exports = router;
