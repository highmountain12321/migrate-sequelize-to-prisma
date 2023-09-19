const { wrap: async } = require('co');
const { models } = require('../../../sequelize');

const _ = require('lodash');

exports.list = async function (req, res, next) {
        const {autoTriggerId} = req.params;
        if(autoTriggerId){
            const eventTriggerModel = await models.auto_event_trigger.findByPk(autoTriggerId);
            const actionsModelArray = await eventTriggerModel.getActions();
            res.json(actionsModelArray);
            return;
        }
    const objArray = await models.auto_event_trigger.findAll();
    res.json(objArray);
}
exports.listTypes = async function (req, res, next) {
    const objArray = await models.auto_event_trigger_type.findAll();
    res.json(objArray);
}
exports.show = async function (req, res, next) {
    const id = req.params.eventTriggerId;
    const obj = await models.auto_event_trigger.findByPk(id);
    res.json(obj);
}
exports.update = async function (req, res, next) {
    const id = req.params.eventTriggerId;
    const body  = req.body;
    await models.automation.update(body,{
        returning: true,
        plain: true,
        where:
            {
                id:id
            }});
    const obj = await models.auto_event_trigger.findByPk(id);
    res.status(201).json(obj);
}
exports.create = async function (req, res, next) {
    const {user, role} = req.token;

    const automation = req.body;
    automation.userId = user;

    const newModel = await models.automation.create(automation);
    return res.json(newModel);

}
exports.destroy = async function (req, res,next) {
    try {
        const id = req.params.eventTriggerId;
        const obj = await models.auto_event_trigger.findByPk(id)
        const response = await obj.destroy()
        res.json(response);
    }catch(e){
        console.log(e);
        next(e);
    }
}
