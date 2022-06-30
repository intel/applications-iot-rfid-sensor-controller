/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

const controller = require('./controller');
const router = require('express').Router();

router.get('/', controller.getAll);
router.post('/', controller.create);
router.delete('/', controller.deleteBulk);

router.get('/:epc', controller.getOne);
router.delete('/:epc', controller.deleteOne);
router.get('/:epc/sensors', controller.getTagStats);

module.exports = router;
