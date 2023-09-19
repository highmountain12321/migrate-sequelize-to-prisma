const { wrap: async } = require('co');
const { models } = require('../../sequelize');

const _ = require('lodash');

exports.list = async function (req, res, next) {
    const obj_array = await models.user_group.findAll();
    res.json(obj_array);
}
exports.listUsers = async function (req, res, next) {
  //  const obj_array = await models.user_group.findAll();
   // res.json(obj_array);
}


exports.show = async function (req, res, next) {
    const id = req.params.id;
    const obj_array = await models.user_group.findByPk(id);
    res.json(obj_array);
}
exports.update = async function (req, res, next) {
    const id = req.params.id;

    const body  = req.body;
    await models.user_group.update(body,{
        returning: true,
        plain: true,
        where:
            {
                id:id
            }});
    const newProposal = await models.user_group.findByPk(id);
    res.status(201).json(newProposal);
}
exports.create = async function (req, res, next) {
    const userModel = req.userModel;
    const newProposal = req.body;
    newProposal.userId = userModel.id;
    const newProposalModal = await models.user_group.create(newProposal);
    return res.json(newProposalModal);

}
exports.destroy = async function (req, res,next) {
    try {
        const id = req.params.id;
        const obj = await models.user_group.findByPk(id)
        const response = await obj.destroy()
        res.json(response);
    }catch(e){
        console.log(e);
        next(e);
    }
}
