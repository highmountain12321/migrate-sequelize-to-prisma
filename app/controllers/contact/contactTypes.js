const { models } = require('../../../sequelize');
exports.list = async function (req, res, next) {
    const data = await models.contact_type.findAll({
        where: {
            isActive: true
        }
    });
    res.json({rows:data});
}
