const { wrap: async } = require('co');
const { models } = require('../../../sequelize');

const _ = require('lodash');

exports.list = async function (req, res, next) {
    const data = await models.resource_document_type.findAll({
        where: {
            isActive: true
        }
    });
    res.json(data);
}


exports.create = async function(req, res,next) {

    if (req.body.id) {
        res.status(400).send(`Bad request: ID should not be provided, since it is determined automatically by the database.`)
    } else {
        const documentType = await models.resource_document_type.create(req.body);
        return res.json(documentType);
    }

}
exports.update = async function (req, res, next) {
    const id = req.params.id;

    const body  = req.body;
    await models.resource_document_type.update(body,{
        returning: true,
        plain: true,
        where:
            {
                id:id
            }});
    const newProposal = await models.resource_document_type.findByPk(id);
    res.status(201).json(newProposal);
}
exports.destroy = async function (req, res,next) {
    try {
        const id = req.params.id;
        const obj = await  models.resource_document_type.findByPk(id)
        const response = await obj.destroy()
        res.json(response);
    }catch(e){
        console.log(e);
        next(e);
    }
}
