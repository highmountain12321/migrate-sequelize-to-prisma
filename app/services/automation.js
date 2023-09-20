const prisma = require('../lib/prisma');
const Action = {
    'assignContactToTeam': async function(contactJson, options = {}) {
        const { id } = contactJson;
        const targetObjectId = this.targetGroupId;
        
        if (!targetObjectId) {
            return false;
        }
        
        const targetModel = await prisma.userGroup.findUnique({
            where: {
                id: targetObjectId,
                isActive: true,
            },
        });
        
        if (!targetModel) {
            throw new Error(`${targetObjectId} Not Active`);
        }
        
        const model = await prisma.contact.findUnique({
            where: {
                id: id,
                isActive: true,
            },
        });
        
        if (!model) {
            throw new Error(`${id} Not Active`);
        }
        
        await prisma.userGroup.update({
            where: {
                id: targetObjectId,
            },
            data: {
                contacts: {
                    connect: {
                        id: id,
                    },
                },
            },
        });
    },
    'assignContactToRep': async function(contactJson, options = {}) {
        const { id } = contactJson;
        const targetObjectId = this.targetUserId;
        
        if (!targetObjectId) {
            return false;
        }
        
        const targetModel = await prisma.user.findUnique({
            where: {
                id: targetObjectId,
                isActive: true,
            },
        });
        
        if (!targetModel) {
            throw new Error(`${targetObjectId} Not Active`);
        }
        
        const model = await prisma.contact.findUnique({
            where: {
                id: id,
                isActive: true,
            },
        });
        
        if (!model) {
            throw new Error(`${id} Not Active`);
        }
        
        await prisma.user.update({
            where: {
                id: targetObjectId,
            },
            data: {
                contacts: {
                    connect: {
                        id: id,
                    },
                },
            },
        });
    },
    'sendContactToGoHighLevel': async function(contactJson, options = {}) {
        const { id, sourceId } = contactJson;
        const isManual = options?.manual;
        
        if (!isManual && contactJson.sourceId !== this.contactSourceId) {
            console.log(`contact SourceID ${sourceId} does not match automation sourceId ${this.contactSourceId}`);
            return false;
        }
        
        const model = await prisma.contact.findUnique({
            where: {
                id: id,
                isActive: true,
            },
            include: {
                source: true,
            },
        });
        
        if (!model) {
            throw new Error(`${id} Not Active`);
        }
        
        let tags = [];
        
        if (model.source) {
            tags = [model.source.name];
        }
        
        // Implement GoHighLevelService.createContact here using Prisma
    },
    'assignRepToTeam': async function(repJson, options = {}) {
        const { id } = repJson;
        const targetObjectId = this.targetGroupId;
        
        if (!targetObjectId) {
            return false;
        }
        
        const targetModel = await prisma.userGroup.findUnique({
            where: {
                id: targetObjectId,
                isActive: true,
            },
        });
        
        if (!targetModel) {
            throw new Error(`${targetObjectId} Not Active`);
        }
        
        const model = await prisma.user.findUnique({
            where: {
                id: id,
                isActive: true,
            },
        });
        
        if (!model) {
            throw new Error(`${id} Not Active`);
        }
        
        await prisma.userGroup.update({
            where: {
                id: targetObjectId,
            },
            data: {
                users: {
                    connect: {
                        id: id,
                    },
                },
            },
        });
    },
    'invokeContactTwilioFlow': async function(contactJson, options = {}) {
        const { id } = contactJson;
        const model = await prisma.contact.findUnique({
            where: {
                id: id,
                isActive: true,
            },
        });
        
        if (!model) {
            throw new Error(`${id} Not Active`);
        }
        
        const twilioPhoneNumber = this.phoneNumber;
        const contactPhoneNumber = model.primaryPhone;
        const twilioFlowId = this.twilioFlowId;
        const targetUrlRaw = this.targetUrl;
        
        let targetUrl;
        
        if (targetUrlRaw.indexOf(':CID') > -1) {
            targetUrl = targetUrlRaw.replace(":CID", id);
        } else {
            targetUrl = targetUrlRaw;
        }
        
        if (!contactPhoneNumber || !twilioFlowId) {
            return false;
        }
        
        if (model.sourceId !== this.contactSourceId) {
            console.log(`contact SourceID ${model.sourceId} does not match automation sourceId ${this.contactSourceId}`);
            return false;
        }
        
        let toFiltered = contactPhoneNumber.toString().replace(/\D/g,'');
        let fromFiltered = twilioPhoneNumber.toString().replace(/\D/g,'');
        
        // Implement Twilio.invokeFlow here using Prisma
        
        await prisma.contactAutomationRun.create({
            data: {
                contactId: id,
                automationId: this.id,
            },
        });
    },
}

module.exports = Action;
