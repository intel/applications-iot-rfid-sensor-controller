/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

const router = require('express').Router();
const controller = require('./controller');

router.get('/', controller.getAll);
router.get('/:behaviorId', controller.getOne);
router.post('/:behaviorId', controller.upsertOne);
router.delete('/:behaviorId', controller.deleteOne);

module.exports = router;
