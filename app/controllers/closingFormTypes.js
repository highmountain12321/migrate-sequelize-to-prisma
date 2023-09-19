const { wrap: async } = require('co');
const { models } = require('../../sequelize');

const _ = require('lodash');

exports.create = async function(req, res,next) {

    if (req.body.id) {
        res.status(400).send(`Bad request: ID should not be provided, since it is determined automatically by the database.`)
    } else {
        const closingformtype = await models.closing_form_update_type.create(req.body);
        return res.json(closingformtype);
    }

}

exports.update = async function (req, res, next) {
    const id = req.params.id;

    const body  = req.body;
    await models.closing_form_update_type.update(body,{
        returning: true,
        plain: true,
        where:
            {
                id:id 
            }});
    const newProposal = await models.closing_form_update_type.findByPk(id);
    res.status(201).json(newProposal);
}
exports.destroy = async function (req, res,next) {
    try {
        const id = req.params.id;
        const obj = await  models.closing_form_update_type.findByPk(id)
        const response = await obj.destroy()
        res.json(response);
    }catch(e){
        console.log(e);
        next(e);
    }
}
exports.list = async function (req, res, next) {
    const data = await models.closing_form_update_type.findAndCountAll({
        where: {
            isActive: true
        }
    });
    res.json(data);
}
