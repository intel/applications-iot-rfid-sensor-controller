/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

const router = require('express').Router();
const controller = require('./controller');

router.get('/images', controller.getImages);
router.post('/images', controller.postImage);
router.delete('/images', controller.deleteImage);
router.get('/sensors/info', controller.getSensorsInfo);
router.get('/sensors/upgrade', controller.getSensorsUpgrade);
router.post('/sensors/upgrade', controller.postSensorsUpgrade);

module.exports = router;
