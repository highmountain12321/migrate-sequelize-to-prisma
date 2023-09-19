const { wrap: async } = require('co');
const { models } = require('../../../sequelize');

const _ = require('lodash');

exports.list = async function (req, res, next) {
    const params = req.query;
    const query = {
        include: [{
            model: models.auto_event_trigger,
            as:'trigger'
        },{
            model: models.auto_action,
            as:'action'
        },{
            model: models.user,
            as:'targetUser'
        },{
            model: models.user_group,
            as:'targetGroup'
        }]
    }
    if(params.actionId){
        query.where = {
            actionId: params.actionId
        }
    }
    const objArray = await models.auto_automation.findAndCountAll(query);

    res.json(objArray);
}
exports.show = async function (req, res, next) {
    const id = req.params.automationId;
    const obj = await models.auto_automation.findByPk(id);
    res.json(obj);
}
exports.update = async function (req, res, next) {
    const id = req.params.automationId;
    const body  = req.body;
    await models.auto_automation.update(body,{
        returning: true,
        plain: true,
        where:
            {
                id:id
            }});
    const obj = await models.auto_automation.findByPk(id,{
        include: [{
            model: models.auto_event_trigger,
            as:'trigger'
        },{
            model: models.auto_action,
            as:'action'
        },{
            model: models.user,
            as:'targetUser'
        },{
            model: models.contact_source,
            as:'contactSource'
        },{
            model: models.user_group,
            as:'targetGroup'
        }]
    });
    res.status(201).json(obj);
}
exports.create = async function (req, res, next) {
    const {user, role} = req.token;

    const automation = req.body;
    automation.userId = user;
    automation.creatorId = user;
    const newModel = await models.auto_automation.create(automation,{
        include: [{
            model: models.auto_event_trigger,
            as:'trigger'
        },{
            model: models.auto_action,
            as:'action'
        },{
            model: models.user,
            as:'targetUser'
        },{
            model: models.user_group,
            as:'targetGroup'
        }]
    });
    return res.json(newModel);
}
exports.destroy = async function (req, res,next) {
    try {
        const id = req.params.automationId;
        const obj = await models.auto_automation.findByPk(id)
        const response = await obj.destroy()
        res.json(response);
    }catch(e){
        console.log(e);
        next(e);
    }
}
