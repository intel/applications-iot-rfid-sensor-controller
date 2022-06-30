/*
* Copyright (C) 2022 Intel Corporation
* SPDX-License-Identifier: BSD-3-Clause
 */

const db = require('../persist/db');
const Tag = require('./tag');
const logger = require('../logger')('tag-controller');

async function create(req, res) {
  try {
    const results = await Tag.createBulk(req.body);
    return res.status(201).json(results);
  } catch (err) {
    logger.error(`creating tag : ${err.toString()}`);
    return res.status(400).json({message: err.message});
  }
}

async function getAll(req, res) {
  try {
    let sortCol = 'epc';
    let sortDir = 'ASC';
    switch (req.query.sortCol) {
      case 'EPC':
        sortCol = 'epc';
        break;
      case 'TID':
        sortDir = 'tid';
        break;
      case 'State':
        sortDir = 'state';
        break;
      case 'Location':
        sortDir = 'location';
        break;
      case 'Facility':
        sortDir = 'facilityId';
        break;
      case 'LastRead':
        sortDir = 'lastRead';
        break;
    }
    switch (req.query.sortDir) {
      case 'ASC':
        sortDir = 'ASC';
        break;
      case 'DESC':
        sortDir = 'DESC';
        break;
    }
    const filter = {};
    if (req.query.filterEpc) {
      const s = sanitizeFilter(req.query.filterEpc);
      filter['epc'] = {
        [db.Op.like]: s
      };
    }
    if (req.query.filterTid) {
      const s = sanitizeFilter(req.query.filterTid);
      filter['tid'] = {
        [db.Op.like]: s
      };
    }
    const params = {
      where: filter,
      order: [[sortCol, sortDir]],
      offset: req.query.offset ? req.query.offset : 0,
      limit: req.query.limit ? req.query.limit : null,
    };
    const result = await Tag.getAll(params);
    return res.status(200).json(result);
  } catch (err) {
    logger.error(`getting all : ${err.toString()}`);
    return res.status(500).json({message: err.message});
  }
}

function sanitizeFilter(f) {
  return f.replace(/[^A-Fa-f0-9%]/g, '').toUpperCase();
}

async function getOne(req, res) {
  try {
    return res.status(200).json(Tag.getOne(req.params.epc));
  } catch (err) {
    logger.error(`getting one : ${err.toString()}`);
    return res.status(500).json({message: err.message});
  }
}

async function deleteOne(req, res) {
  try {
    const tagsCount = await Tag.deleteOne(req.params.epc);
    if (tagsCount) {
      return res.status(200).json(req.params.epc);
    } else {
      return res.status(404).json({status: 404, message: `Bad epc: ${  req.params.epc}`});
    }
  } catch (err) {
    logger.error(`deleting one tag ${req.params.epc}: ${err.toString()}`);
    return res.status(500).json({message: err.message});
  }
}

async function deleteBulk(req, res) {
  try {
    let epcList;
    if (req.body && req.body.tags && Array.isArray(req.body.tags)) {
      epcList = req.body.tags;
    }
    const deletedCount = await Tag.deleteBulk(epcList);
    return res.status(200).json({ count: deletedCount });
  } catch (err) {
    logger.error(`deleting bulk tags with epcs ${req.body.tags} : ${err.toString()}`);
    return res.status(500).json({message: err.message});
  }
}

async function getTagStats(req, res) {
  try {
    const reads = await Tag.getStats(req.params.epc);
    return res.status(200).json(reads);
  } catch (err) {
    logger.error(`getting tag stats : ${err.toString()}`);
    return res.status(500).json({message: err.message});
  }
}

module.exports = {
  create,
  getAll,
  getOne,
  deleteOne,
  deleteBulk,
  getTagStats,
};

