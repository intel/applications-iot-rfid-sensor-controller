/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

const controller = require('./controller');
const router = require('express').Router();

router.get('/', controller.getAll);
router.post('/', controller.upsertBulk);
router.get('/runstate', controller.getRunState);
router.put('/runstate', controller.putRunState);
router.put('/reboot', controller.rebootAll);

router.get('/:deviceId', controller.getOne);
router.post('/:deviceId', controller.upsertOne);
router.delete('/:deviceId', controller.deleteOne);
router.put('/:deviceId/reboot', controller.rebootOne);

module.exports = router;
