
/**
 * Module dependencies.
 */

const { wrap: async } = require('co');
const _ = require('lodash');
const { models } = require('../../sequelize');


exports.create = async function (req, res) {
    const userModel = req.userModel;
    const ipAddress = (
        req.headers['cf-connecting-ip'] ||
        req.headers['x-real-ip'] ||
        req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress || ''
    ).split(',');
    if(ipAddress && ipAddress[0].length > 0) {
        await userModel.logLocation(ipAddress[0])
    }
    res.json({isOkay: true});

}
exports.list = async function (req, res) {
    const limit = req.query.limit = 1000;
    const offset = req.query.offset = 0;

    const data = await models.login.findAll({
        limit:limit,
        offset:offset,
        attributes:['ip','city','state','country','createdAt'],
        order: [
            ['id', 'DESC']
        ],
        include: [{
            model: models.user,
            as: 'user',
            attributes:['firstName','lastName','id']
        },{
            model: models.user,
            as: 'manager',
            attributes:['firstName','lastName','id']
        }]
    });
    res.json(data);
}

