const { wrap: async } = require('co');
const { models } = require('../../sequelize');

const _ = require('lodash');

exports.list = async function (req, res, next) {
    const obj_array = await models.lender_proposal.findAll();
    res.json(obj_array);
}
exports.show = async function (req, res, next) {
    const id = req.params.lenderProposalId;
    const obj_array = await models.lender_proposal.findByPk(id);
    res.json(obj_array);
}
exports.update = async function (req, res, next) {
    const id = req.params.lenderProposalId;

    const body  = req.body;
    await models.lender_proposal.update(body,{
        returning: true,
        plain: true,
        where:
            {
                id:id
            }});
    const newProposal = await models.lender_proposal.findByPk(id);
    res.status(201).json(newProposal);
}
exports.create = async function (req, res, next) {
    const {user, role} = req.token;

    const newProposal = req.body;
    newProposal.submittedBy = user;
    const newProposalModal = await models.lender_proposal.create(newProposal);
    return res.json(newProposalModal);

}
exports.destroy = async function (req, res,next) {
    try {
        const id = req.params.lenderProposalId;
        const obj = await models.lender_proposal.findByPk(id)
        const response = await obj.destroy()
        res.json(response);
    }catch(e){
        console.log(e);
        next(e);
    }
}
