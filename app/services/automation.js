const { wrap: async } = require('co');
const {models} = require("../../sequelize");

const Action = {
    'assignContactToTeam': async function(contactJson, options = {}){
        const {models} = require('../../sequelize');

        try {
            const {id} = contactJson;
            const targetObjectId = this.targetGroupId;
            if(!targetObjectId){
                return false;
            }
            const targetModel = await models.user_group.findByPk(targetObjectId);
            if (!targetModel || targetModel.isActive === false) {
                throw new Error(`${targetObjectId} Not Active`);
            }
            const model = await models.contact.findByPk(id);
            if (!model || model.isActive === false) {
                throw new Error(`${targetObjectId} Not Active`);
                return;
            }
            await targetModel.addContact(model);
        }catch(e){
            console.error(e);
            throw e;
        }

    },
    'assignContactToRep': async function(contactJson, options = {}){
        const {models} = require('../../sequelize');

        try {
            const {id} = contactJson;
            const targetObjectId = this.targetUserId;
            if(!targetObjectId){
                return false;
            }
            const targetModel = await models.user.findByPk(targetObjectId);
            if (!targetModel || targetModel.isActive === false) {
                throw new Error(`${targetObjectId} Not Active`);
                return;
            }
            const model = await models.contact.findByPk(id);
            if (!model || model.isActive === false) {
                throw new Error(`Not Active`);
                return;
            }
            await targetModel.addContact(model);
        }catch(e){
            console.error(e);
            throw e;
        }

    },
    'sendContactToGoHighLevel': async function(contactJson, options = {}){
        const {models} = require('../../sequelize');
        const GoHighLevelService = require('./goHighLevel');

        try {
            const isManual = options?.manual;
            const { id,sourceId } = contactJson;

            if (!isManual && contactJson.sourceId !== this.contactSourceId) {
                console.log(`contact SourceID ${sourceId} does not match automation sourceId ${this.contactSourceId}`)
                return false;
            }

            const model = await models.contact.findByPk(id,{
                include:{
                    model: models.contact_source,
                    as: 'source'
                }
            });
            if (!model || model.isActive === false) {
                throw new Error(`Not Active`);
                return;
            }
            let tags = [];
            if(model.source){
                tags = [model.source.name]
            }
            return GoHighLevelService.createContact(model,tags);
        }catch(e){
            console.error(e);
            throw e;
        }
    },
    'assignRepToTeam': async function(repJson, options = {}){
        // tslint:disable-next-line:no-shadowed-variable
        const {models} = require('../../sequelize');

        try {
            const {id} = repJson;
            const targetObjectId = this.targetGroupId;
            if(!targetObjectId){
                return false;
            }
            const targetModel = await models.user_group.findByPk(targetObjectId);
            if (!targetModel || targetModel.isActive === false) {
                throw new Error(`${targetObjectId} Not Active`);
            }
            const model = await models.user.findByPk(id);
            if (!model || model.isActive === false) {
                 throw new Error(`Not Active`);
                 return;
            }
            await targetModel.addUser(model);
        }catch(e){
            console.error(e);
            throw e;
        }
    },
    'invokeContactTwilioFlow': async function(contactJson, options = {}){
        // tslint:disable-next-line:no-shadowed-variable
        const { models } = require('../../sequelize');
        const {Services} = require("./index");

        try {
            const {id} = contactJson;
            const model = await models.contact.findByPk(id);
            if (!model || model.isActive === false) {
                throw new Error(`Not Active`);
                return;
            }

            const twilioPhoneNumber = this.phoneNumber;
            const contactPhoneNumber = model.primaryPhone;
            const twilioFlowId = this.twilioFlowId;
            const targetUrlRaw = this.targetUrl;
            let targetUrl;
            if(targetUrlRaw.indexOf(':CID') > -1){
                 targetUrl = targetUrlRaw.replace(":CID", id);
            }else{
                targetUrl = targetUrlRaw;
            }
            if(!contactPhoneNumber || !twilioFlowId){
                return false;
            }
            if (model.sourceId !== this.contactSourceId) {
                console.log(`contact SourceID ${model.sourceId} does not match automation sourceId ${this.contactSourceId}`)
                return false;
            }
            let toFiltered = contactPhoneNumber.toString().replace(/\D/g,'');
            let fromFiltered = twilioPhoneNumber.toString().replace(/\D/g,'');

         ///   const {field2, field1,state, city, address,firstName, lastName, to, from='8557880646', flowId = 'FW447a46c80720031fb0e423d90c00865f'} =  req.query;


            //const link = `https://schedule.g3.app?cId=${toFiltered}`;

            const twilioOptions = {
                to: `+1${toFiltered}`,
                from: `+1${fromFiltered}`,
                parameters: {
                    link: targetUrl,
                    lastName: model.lastName,
                    firstName: model.firstName,
                    id: model.id
                }
            }
            const data = await Services.Twilio.invokeFlow(twilioFlowId,twilioOptions);

            await models.contact_automation_run.create({
                contactId: id,
                automationId: this.id
            });

            console.log(data);

        }catch(e){
            console.error(e);
            throw e;
        }

    }
}

exports.runAutomation = async(automationId, inputObject, options) =>{
    // tslint:disable-next-line:no-shadowed-variable
    const {models} = require('../../sequelize');
    const automationModel = await models.auto_automation.findByPk(automationId);
    if(!automationModel){
        return false;
        return;
    }
    const actionModel = await automationModel.getAction();
    if(actionModel.fn && Action[actionModel.fn]) {
        await Action[actionModel.fn].call(automationModel, inputObject,options);
        automationModel.lastRunDate = new Date();
        await automationModel.save();
    }
}



exports.runAutomations = async(triggerId, inputObject) =>{
    // tslint:disable-next-line:no-shadowed-variable
    const {models} = require('../../sequelize');
    const automationsArray = await models.auto_automation.findAll({where:{isActive:true, triggerId}});
    if(!automationsArray || automationsArray.length === 0 ){
        return false;
        return;
    }
    for(let i = 0; i < automationsArray.length;i++){
        try {
            const automationModel = automationsArray[i];
            const actionModel = await automationModel.getAction();
            if(actionModel.fn && Action[actionModel.fn]) {
                await Action[actionModel.fn].call(automationModel, inputObject);
                automationModel.lastRunDate = new Date();
                await automationModel.save();
            }
        }catch(e){
            console.error(e);
        }
        // console.log(actionModel.fn);
    }
}
