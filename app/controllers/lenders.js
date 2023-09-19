const { wrap: async } = require('co');
const { models } = require('../../sequelize');

const _ = require('lodash');

exports.list = async function (req, res, next) {
    const {isActive = true} = req.query;
    const obj_array = await models.lender.findAndCountAll({where:{isActive}});
    res.json(obj_array);
}
exports.show = async function (req, res, next) {
    const id = req.params.id;
    const obj_array = await models.lender.findByPk(id);
    res.json(obj_array);
}
exports.update = async function (req, res, next) {
    const id = req.params.id;

    const body  = req.body;
    await models.lender.update(body,{
        returning: true,
        plain: true,
        where:
            {
                id:id
            }});
    const newProposal = await models.lender.findByPk(id);
    res.status(201).json(newProposal);
}
exports.create = async function (req, res, next) {
    const {user, role} = req.token;

    const newProposal = req.body;
    newProposal.userId = user;
    const newProposalModal = await models.lender.create(newProposal);
    return res.json(newProposalModal);

}
exports.destroy = async function (req, res,next) {
    try {
        const id = req.params.id;
        const obj = await models.lender.findByPk(id)
        const response = await obj.destroy()
        res.json(response);
    }catch(e){
        console.log(e);
        next(e);
    }
}
