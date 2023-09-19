'use strict';

/**
 * Module dependencies.
 */
const { wrap: async } = require('co');
const { models } = require('../../sequelize');
const _ = require('lodash');


/**
 * List
 */

exports.list = async function (req, res, next) {
  const obj_array = await models.disposition.findAll({
    where:{
      isActive:true
    }
  });
  const grouped = _.chain(obj_array)
      // Group the elements of Array based on `color` property
      .groupBy("group")
      // `key` is group's name (color), `value` is the array of objects
      .map((value, key) => ({ key: key, items: value }))
      .value();

  res.json({data: grouped});
}
exports.create = async function (req, res, next) {
  try {
    const body = req.body;
    const obj_array = await models.disposition.create(body);
    res.json({data: obj_array});
  }catch(e){
    console.error(e)
    next(e);
  }
}
exports.destroy = async function (req, res, next) {
  try {
    const id = req.params.id;
    const obj = await models.disposition.findByPk(id)
    const response = await obj.destroy()
    res.json({data: response});
  }catch(e){
    console.log(e);
    next(e);
  }
}

