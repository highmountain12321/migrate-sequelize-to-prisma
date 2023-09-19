const { wrap: async } = require('co');
const { models } = require('../../sequelize');

const _ = require('lodash');

exports.list = async function (req, res, next) {
    const obj_array = await models.utility_provider.findAll();
    res.json(obj_array);
}
