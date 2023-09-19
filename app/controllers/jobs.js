const { wrap: async } = require('co');
const { models } = require('../../sequelize');

const _ = require('lodash');

exports.list = async function (req, res, next) {
    const objArray = await models.auto_action.findAll();
    res.json(objArray);
}
exports.listTypes = async function (req, res, next) {
    const objArray = await models.auto_action_type.findAll();
    res.json(objArray);
}
exports.show = async function (req, res, next) {
    const id = req.params.actionId;
    const obj = await models.auto_action.findByPk(id);
    res.json(obj);
}
exports.update = async function (req, res, next) {
    const id = req.params.actionId;
    const body  = req.body;
    await models.automation.update(body,{
        returning: true,
        plain: true,
        where:
            {
                id:id
            }});
    const obj = await models.auto_action.findByPk(id);
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
        const id = req.params.actionId;
        const obj = await models.auto_action.findByPk(id)
        const response = await obj.destroy()
        res.json(response);
    }catch(e){
        console.log(e);
        next(e);
    }
}
exports.runJob = async function (req, res,next) {
    const jobs = [];
    const contactJob  = {
        contactId: null,
        userId: null,
        automations : []
    }
    try {
        const typeId = req.query.contactEventTypeId;
        const array = await models.contact_event.findAll({
            where:{
                typeId:typeId
            }
        });
        let automations = [];
        for(let i = 0; i < array.length; i++){
            const contactEvent = array[i];
            const userId = contactEvent.userId;
            const contactId = contactEvent.contactId;

            const contactModel = await models.contact.findByPk(contactId);
            const userModel = await models.user.findByPk(userId);

            const userAutomations = await models.auto_automation.findAll({
                where:{
                    userId:contactEvent.userId
                },
                include:[{
                    model: models.auto_automation_template,
                    as:'templates',
                    include:[{
                        model: models.auto_action_template,
                        as:'action_templates',
                        include:[{
                            model: models.app_phone,
                            as:'phone'
                        }]
                    }]
                }]
            });
            automations = [...userAutomations];
        }
        res.json(automations);
    }catch(e){
        console.log(e);
        next(e);
    }
}
