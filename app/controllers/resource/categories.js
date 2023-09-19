const { wrap: async } = require('co');
const { models } = require('../../../sequelize');

const _ = require('lodash');

exports.list = async function (req, res, next) {
    const data = await models.resource_category.findAndCountAll({
        where: {
            isActive: true
        }
    });
    res.json(data);
}
exports.update = async function (req, res, next) {
    const obj_array = await models.resource_category.findAll();
    res.json(obj_array);
}
exports.create = async function(req, res,next) {

    if (req.body.id) {
        res.status(400).send(`Bad request: ID should not be provided, since it is determined automatically by the database.`)
    } else {
        const documentType = await models.resource_category.create(req.body);
        return res.json(documentType);
    }

}
exports.update = async function (req, res, next) {
    const id = req.params.id;

    const body  = req.body;
    await models.resource_category.update(body,{
        returning: true,
        plain: true,
        where:
            {
                id:id
            }});
    const newProposal = await models.resource_category.findByPk(id);
    res.status(201).json(newProposal);
}
exports.destroy = async function (req, res,next) {
    try {
        const id = req.params.id;
        const obj = await  models.resource_category.findByPk(id)
        const response = await obj.destroy()
        res.json(response);
    }catch(e){
        console.log(e);
        next(e);
    }
}
