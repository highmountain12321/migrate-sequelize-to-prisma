const { models } = require('../../../sequelize');

exports.list = async function (req, res, next) {
    const obj_array = await models.partner_type.findAll({
        order: [
            ['order', 'ASC']
        ],
    });
    res.json({rows:obj_array});
}