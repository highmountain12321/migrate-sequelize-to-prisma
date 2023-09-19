const { wrap: async } = require('co');
const { models } = require('../../sequelize');
const { Services } = require('../services');

const _ = require('lodash');

exports.list = async function (req, res, next) {
    try {
        const state = req.query.state;
        const list = await Services.SolarIncentives.getIncentives(state)
        res.json(list);
    }catch(e){
        console.error(e);
        next(e);
    }
}
exports.show = async function (req, res, next) {
    const id = req.params.id;
    const obj_array = await models.incentive.findByPk(id);
    res.json(obj_array);
}
exports.update = async function (req, res, next) {
    const id = req.params.id;

    const body  = req.body;
    await models.incentive.update(body,{
        returning: true,
        plain: true,
        where:
            {
                id:id
            }});
    const newProposal = await models.incentive.findByPk(id);
    res.status(201).json(newProposal);
}
exports.create = async function (req, res, next) {
    const {user, role} = req.token;

    const newProposal = req.body;
    newProposal.userId = user;
    newProposal.submittedBy =user;
    const newProposalModal = await models.incentive.create(newProposal);
    return res.json(newProposalModal);

}
exports.destroy = async function (req, res,next) {
    try {
        const id = req.params.id;
        const obj = await models.incentive.findByPk(id)
        const response = await obj.destroy()
        res.json(response);
    }catch(e){
        console.log(e);
        next(e);
    }
}
