const { wrap: async } = require('co');
const { models } = require('../../sequelize');

const _ = require('lodash');

exports.list = async function (req, res, next) {
    const {isActive = true} = req.query;
    const objArray = await  models.api_key.findAndCountAll({
        where: {
            isActive
        },
        include: [{
            model: models.user,
            as: 'user',
            attributes:['firstName','lastName','id','picUrl'],
            include: [
                {
                    as: "role",
                    model: models.role,
                    attributes: ['slug'],
                }]
        },{
            attributes:['name','id'],
            model: models.user_group,
            as: 'group',
        }]
    });
    res.json(objArray);
}
exports.show = async function (req, res, next) {
    const id = req.params.id;
    const objArray = await  models.api_key.findByPk(id);
    res.json(objArray);
}
exports.update = async function (req, res, next) {
    const id = req.params.apiKeyId;

    const body  = req.body;
    await  models.api_key.update(body,{
        returning: true,
        plain: true,
        where:
            {
                id:id
            }});
    const item = await  models.api_key.findByPk(id);
    res.status(201).json(item);
}
exports.create = async function (req, res, next) {
    const {user, role} = req.token;

    const newProposal = req.body;
    newProposal.userId = user;

    const newProposalModal = await  models.api_key.create(newProposal);
    return res.json(newProposalModal);

}
exports.destroy = async function (req, res,next) {
    try {
        const id = req.params.apiKeyId;
        const obj = await  models.api_key.findByPk(id)
        const response = await obj.destroy()
        res.json(response);
    }catch(e){
        console.log(e);
        next(e);
    }
}
