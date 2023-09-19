const {models} = require("../../sequelize");
const {Services} = require("../services");
const jsonexport = require('jsonexport');





exports.createExternalContactEvent = async function(req, res,next) {
    const body = req.body;
    const loadedContactModel = req.loadedContactModel;
    const newEvent = await model.app_event.create(body);
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
exports.showPartner = async function(req,res,next){
    const partnerId = req.params.partnerId;
    const partnerModel = await models.partner.findByPk(partnerId);
    res.json(partnerModel);
}
exports.showContact = async function(req,res,next){
    const id = req.params.contactId;
    const contactModel = await models.contact.findByPk(id,{
        include:[{
            model: models.meter,
            as:'meters',
        },{
            model: models.document,
            as:'documents',
            include:[{
                model: models.document_type,
                as:'type'
            }],
        }],
    });
    const partners = await contactModel.getAvailablePartners();

    res.json({contact:contactModel, partners});
}
exports.listPartners = async function(req,res,next){
    const contactId = req.query.contactId;
    const contactModel = await models.contact.findByPk(contactId);
    const partners = await contactModel.getAvailablePartners();
    res.json(partners);
}
exports.createPartnerProposal = async function(req,res,next){

    const body  = req.body;
    if(!body.contactId || !body.partnerId || !body.url){
        return next({message:'Request not complete'});
    }

    const contactModel = await models.contact.findByPk(body.contactId);
    const partnerModel = await models.partner.findByPk(body.partnerId);

    const newProposalModal = await models.partner_proposal.create(body);
    await partnerModel.addProposals(newProposalModal);
    await contactModel.addPartnerProposals(newProposalModal);

    return res.json(newProposalModal);
}
exports.exportExternalCompanyLead = async function (req, res, next) {
    const userId = req.params.userId;
    const apiKey = req.query.apiKey;
    const format = req.query.format || 'json';


    const sort = req.query.sort || 'desc';
    const userModel = await models.user.findByPk(userId);
    if(userModel.apiKey !==  apiKey){
        return res.json({message:'API Key not correct'});
    }
    if(!userModel){
        return res.json({message:'user not found'});
    }

    const leads = await models.company_contact_temp.findAll({
        order: [["id", sort]],
        where:{
            userId:userId
        }});


    if(format === 'json'){
        return res.json(leads);
    }
    jsonexport(leads, {rowDelimiter: ','}, function(err, csv){
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/csv');

        res.write(csv)

        res.end();
    });

}
exports.createExternalLeadAPI = async function (req, res, next) {



    const apiKey = req.query.apiKey;
    const source = req.query.source;
    const newContact = req.body;
    const apiModel = await models.api_key.findOne({where:{
        apiKey: apiKey
    }});
    if(!apiModel){
        return res.json({message:'apiKey not found'});
    }
    if(!apiModel.isActive){
        res.json({message:'API Key not active'});
        return;
    }
    const userModel = await models.user.findByPk(apiModel.userId);
    if(!userModel){
        return res.json({message:'user not found'});
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
    if(source) {
        sourceModel = await models.contact_source.findOne({where: {slug: source}});
    }
    if (!sourceModel) {
        sourceModel = await models.contact_source.findOne({where: {isDefault: true}});
    }
    const genType = await userModel.getGenType();
    newContact.genTypeId = genType.id;
    const leadObject = {
        gender: newContact.gender,
        busWebsite: newContact.busWebsite,
        busName: newContact.busName,
        firstName: newContact.firstName,
        lastName: newContact.lastName,
        primaryPhone: newContact.primaryPhone,
        address1: newContact.address1,
        address2: newContact.address2,
        email: newContact.email,
        city: newContact.city,
        state: newContact.state,
        postalCode: newContact.postalCode,
        sourceId:sourceModel.id,
        genTypeId:  genType.id
    }


    try {
        const newContactModel = await models.contact.create(leadObject);
        await userModel.addContact(newContactModel);
        if(!apiModel.count){
            apiModel.count = 0;
        }
        apiModel.count++;
        apiModel.requestDate = new Date();
        await apiModel.save();


        return res.json({'isOkay': true});
    }catch(e){
        return res.json({'error': e.message});
    }


}


exports.createExternalCompanyLead = async function (req, res, next) {
    const userId = req.params.userId;
    const userModel = await models.user.findByPk(userId);
    if(!userModel){
        return res.json({message:'user not found'});
    }

    try {
        const newContact = req.body;
        //// newContact.user1Id = userModel.id;


        newContact.userId = userId;
        const newContactModel = await models.company_contact_temp.create(newContact);

        if(userModel) {
            try {
                await Services.Email.sendRepLeadFormEmail(userModel.email, {
                    name: `${newContactModel.pocFirstName} ${newContactModel.pocLastName}`,
                    phone: `${newContactModel.pocPrimaryPhone}`
                });
            }catch(e){
                console.error('couldnt send leadform email ',e)
            }


        }
        res.status(201).json({message:'Added', company_contact:newContactModel.id});
    }catch(e){
        console.error(e);
    }
}
