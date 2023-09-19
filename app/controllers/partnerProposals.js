const { wrap: async } = require('co');
const { models } = require('../../sequelize');

const _ = require('lodash');

exports.createComment = async function (req, res, next) {
    const {user, role} = req.token;
    const loadedModel = req.loadedPartnerProposal;
    const newComment = req.body;
    const newCommentModel =await models.closing_form_comment.create({
        closingFormId:loadedClosingFormModel.id,
        comment: newComment.comment,
        userId: user
    });
    await newCommentModel.reload();
    req.json(newCommentModel);

}

exports.list = async function (req, res, next) {
    const obj_array = await models.partner_proposal.findAll();
    res.json(obj_array);
}
exports.show = async function (req, res, next) {
    const id = req.params.proposalId;
    const obj_array = await models.partner_proposal.findByPk(id);
    res.json(obj_array);
}
exports.update = async function (req, res, next) {
    const id = req.params.proposalId;

    const body  = req.body;
    await models.partner_proposal.update(body,{
        returning: true,
        plain: true,
        where:
            {
                id:id
            }});
    const newProposal = await models.partner_proposal.findByPk(id);
    res.status(201).json(newProposal);
}
exports.create = async function (req, res, next) {
    const {user, role} = req.token;
    const newProposal = req.body;
    newProposal.submittedBy = user;
    const newProposalModal = await models.partner_proposal.create(newProposal);
    return res.json(newProposalModal);

}
exports.destroy = async function (req, res,next) {
    try {
        const id = req.params.proposalId;
        const obj = await models.partner_proposal.findByPk(id)
        const response = await obj.destroy()
        res.json(response);
    }catch(e){
        console.log(e);
        next(e);
    }
}
