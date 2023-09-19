const { wrap: async } = require('co');
const { models } = require('../../sequelize');

const _ = require('lodash');

exports.list = async function (req, res, next) {
    const data = await models.closing_form_status.findAndCountAll({
        where: {
            isActive: true
        }
    });
    res.json(data);
}
