/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

const router = require('express').Router();
const controller = require('./controller');

router.get('/', controller.getConfig);
router.post('/', controller.postConfig);
router.delete('/', controller.deleteConfig);

module.exports = router;
