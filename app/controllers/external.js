const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { Services } = require('../services');
const jsonexport = require('jsonexport');





exports.createExternalContactEvent = async function(req, res,next) {
    const body = req.body;
    const loadedContactModel = req.loadedContactModel;
    const newEvent = await prisma.app_event.create({data: body});
    await loadedContactModel.addApp_event(newEvent);
    res.json(newEvent);
}

exports.listRepAppointments = async function (req, res, next) {
}
exports.listRepLeads = async function (req, res, next) {
}
exports.connectRep = async function (req, res, next) {
    res.json({
        isOkay:true,
        profile: req.userModel
    });
}
exports.listRepOpportunities = async function (req, res, next) {
}
exports.showPartner = async function(req, res, next) {
    try {
        const partnerId = req.params.partnerId;
        const partnerModel = await prisma.partner.findUnique({
            where: {
                id: parseInt(partnerId, 10)
            }
        });
        res.json(partnerModel);
    } catch (error) {
        next(error);
    }
};

exports.showContact = async function(req, res, next) {
    try {
        const id = req.params.contactId;
        const contactModel = await prisma.contact.findUnique({
            where: { id: parseInt(id, 10) },
            include: {
                meters: true,
                documents: {
                    include: {
                        type: true
                    }
                }
            }
        });
        const partners = await contactModel.getAvailablePartners(); // Prisma doesn't have getAvailablePartners method. You'll need to implement this.
        res.json({ contact: contactModel, partners });
    } catch (error) {
        next(error);
    }
};

exports.listPartners = async function(req, res, next) {
    try {
        const contactId = req.query.contactId;
        const contactModel = await prisma.contact.findUnique({
            where: {
                id: parseInt(contactId, 10)
            }
        });
        // Note: Prisma doesn't provide `getAvailablePartners`. This would need to be implemented separately.
        const partners = await contactModel.getAvailablePartners();
        res.json(partners);
    } catch (error) {
        next(error);
    }
};

exports.createPartnerProposal = async function(req, res, next) {
    try {
        const body = req.body;
        if(!body.contactId || !body.partnerId || !body.url) {
            return next({message:'Request not complete'});
        }

        const newProposalModal = await prisma.partner_proposal.create({
            data: body
        });
        // Note: Prisma doesn't have `addProposals` or `addPartnerProposals`. You need to have a connecting model or modify your schema for these.
        // await partnerModel.addProposals(newProposalModal);
        // await contactModel.addPartnerProposals(newProposalModal);
        res.json(newProposalModal);
    } catch (error) {
        next(error);
    }
};

exports.exportExternalCompanyLead = async function(req, res, next) {
    try {
        const userId = req.params.userId;
        const apiKey = req.query.apiKey;
        const format = req.query.format || 'json';
        const sort = req.query.sort || 'desc';

        const userModel = await prisma.user.findUnique({
            where: {
                id: parseInt(userId, 10)
            }
        });

        if(!userModel || userModel.apiKey !== apiKey) {
            return res.json({message: userModel ? 'API Key not correct' : 'user not found'});
        }

        const leads = await prisma.company_contact_temp.findMany({
            where: {
                userId: parseInt(userId, 10)
            },
            orderBy: {
                id: sort === 'desc' ? 'desc' : 'asc'
            }
        });

        if(format === 'json') {
            return res.json(leads);
        }

        jsonexport(leads, {rowDelimiter: ','}, function(err, csv) {
            if(err) return next(err);
            
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/csv');
            res.write(csv);
            res.end();
        });
    } catch (error) {
        next(error);
    }
};

exports.createExternalLeadAPI = async function (req, res, next) {
    try {
        const apiKey = req.query.apiKey;
        const source = req.query.source;
        const newContact = req.body;

        const apiModel = await prisma.api_key.findFirst({
            where: {
                apiKey: apiKey
            }
        });

        if (!apiModel) {
            return res.json({ message: 'apiKey not found' });
        }
        if (!apiModel.isActive) {
            return res.json({ message: 'API Key not active' });
        }

        const userModel = await prisma.user.findUnique({
            where: {
                id: apiModel.userId
            }
        });

        if (!userModel) {
            return res.json({ message: 'user not found' });
        }
        if(!userModel.firstName || !userModel.lastName){
            return res.json({message:'Missing Name'});
        }
        if(userModel.email && userModel.email.indexOf('@') === -1){
            return res.json({message:'Invalid Email'});
        }
        if(userModel.state && userModel.state.length > 4){
            return res.json({message:'State needs to be abbreviated'});
        }
        if(userModel.state && userModel.state.length > 4){
            return res.json({message:'State needs to be abbreviated'});
        }

        let sourceModel;
        if (source) {
            sourceModel = await prisma.contact_source.findFirst({ where: { slug: source } });
        }
        if (!sourceModel) {
            sourceModel = await prisma.contact_source.findFirst({ where: { isDefault: true } });
        }

        // Assuming 'getGenType' is a relation or method you had in Sequelize, you would need to implement it with Prisma
        const genType = await userModel.getGenType();

        const leadObject = {
            // ... other fields ...
            sourceId: sourceModel.id,
            genTypeId: genType.id
        };

        const newContactModel = await prisma.contact.create({
            data: leadObject
        });

        // Note: Prisma doesn't have an 'addContact' method. This would be handled differently.
        // await userModel.addContact(newContactModel);

        apiModel.count = (apiModel.count || 0) + 1;
        apiModel.requestDate = new Date();
        await prisma.api_key.update({
            where: {
                id: apiModel.id
            },
            data: apiModel
        });

        return res.json({ 'isOkay': true });
    } catch (e) {
        return res.json({ 'error': e.message });
    }
};

exports.createExternalCompanyLead = async function (req, res, next) {
    try {
        const userId = req.params.userId;
        const userModel = await prisma.user.findUnique({
            where: {
                id: parseInt(userId, 10)
            }
        });

        if (!userModel) {
            return res.json({ message: 'user not found' });
        }

        const newContact = req.body;
        newContact.userId = userId;

        const newContactModel = await prisma.company_contact_temp.create({
            data: newContact
        });

        if (userModel) {
            try {
                // Assuming you have an Email service correctly defined and imported.
                await Services.Email.sendRepLeadFormEmail(userModel.email, {
                    name: `${newContactModel.pocFirstName} ${newContactModel.pocLastName}`,
                    phone: `${newContactModel.pocPrimaryPhone}`
                });
            } catch (e) {
                console.error("couldn't send leadform email", e);
            }
        }

        res.status(201).json({ message: 'Added', company_contact: newContactModel.id });
    } catch (e) {
        console.error(e);
    }
};
