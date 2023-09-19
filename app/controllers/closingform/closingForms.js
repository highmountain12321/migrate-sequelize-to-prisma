const { wrap: async } = require('co');
const { models } = require('../../../sequelize');

const _ = require('lodash');
const moment = require("moment");

exports.listAPI = async function (req, res, next) {


}
exports.list = async function (req, res, next) {
    const {isActive = true, limit=20, offset=0} = req.query;
    const userModel = req.userModel;
    const query = {
        offset,
        limit,
        where :{
            isActive
        },
        include: [
            {
                model: models.closing_form_status,
                as: 'status',
                attributes:['name']
            },
            {
                model: models.closing_form_update,
                as: 'updates',
                attributes:['createdAt'],
                include:[{
                    model: models.closing_form_update_type,
                    as: 'type',
                    attributes: ['name']
                }],
                separate: true
            },
            {
                model: models.contact,
                as: 'contact',
                attributes: ['firstName','lastName','email','primaryPhone','busName'],
                include:[{
                    model: models.contact_system,
                    as: 'system'
                }, {
                    separate: true,
                    model: models.partner_proposal,
                    as: 'partnerProposals',
                    include:[ {
                        model: models.partner,
                        as: 'partner',
                        attributes:['name','id']
                    }]
                },{
                    separate: true,
                    model: models.lender_proposal,
                    as: 'lenderProposals',
                    include:[ {
                        model: models.lender,
                        as: 'lender',
                        attributes:['name']
                    }]
                },{
                    model: models.user,
                    as: 'users',
                    attributes:['firstName','lastName','picUrl'],
                    include:[ {
                        model: models.role,
                        as: 'role',
                        attributes:['name']
                    }]
                },{
                    required: true,
                    model: models.contact_stage,
                    as: 'stage',
                    attributes: [
                        'name', 'id','slug'
                    ]
                }]
            }
        ],
        order: [
            ['id', 'DESC']
        ]
    };
    const isAdmin = await userModel.isAdmin();

    if(isAdmin){
        // tslint:disable-next-line:no-shadowed-variable variable-name
        const obj_array = await models.closing_form.findAndCountAll(query);
        res.json(obj_array);
        return;
    }
    // tslint:disable-next-line:variable-name
    const rows = await userModel.getClosingForms(query);
    const count = await userModel.countClosingForms(query);

    res.json({rows,count});
}



exports.listTypes = async function (req, res, next) {
    const obj_array = await models.closing_form_update_type.findAll({
        where:{
            isActive:1,
            isVisible:1
        },
        order: [
            ['id', 'DESC']
        ]
    });
    res.json(obj_array);
}
exports.createType = async function (req, res, next) {
    const newType = req.body;
    const created = await models.closing_form_update_type.create(newType);
    res.json(created);
}



exports.updateType = async function (req, res, next) {
    const obj_array = await models.closing_form_update_type.findAll({
        where:{
            isActive:1
        },
        order: [
            ['id', 'DESC']
        ]
    });
    res.json(obj_array);
}
exports.createComment = async function (req, res, next) {
    const { user, role } = req.token;
    const closingFormId = req.params.closingFormId;
    const comment = req.body.comment;
    const type = req.body.typeId;
    const newComment = await models.closingform_comment.create({
        userId: user,
        comment: comment,
        typeId: type
    });
    const closingForm = await models.closing_form.findByPk(closingFormId);
    await closingForm.addComment(newComment);
    await closingForm.save();
    const comments = await closingForm.getComments({
        include: [{
            model: models.user,
            as: 'user',
            attributes: ['firstName', 'lastName','picUrl'],
            include: [{
              model: models.role,
              as: 'role',
              attributes: ['name']
            }]
        }],
        order: [
            ['id', 'desc']
        ]
    });
    res.status(200).json(comments);
}
exports.listComment = async function (req, res, next) {
    const { user, role } = req.token;
    const closingFormId = req.params.closingFormId;
    const closingForm = await models.closing_form.findByPk(closingFormId);
    const comment = await closingForm.getComments({
        include: [{
            model: models.user,
            as: 'user',
            attributes: ['firstName', 'lastName','picUrl'],
            include: [{
              model: models.role,
              as: 'role',
              attributes: ['name']
            }]
        }],
        order: [
            ['id', 'desc']
        ]
    });
    res.status(200).json(comment);
}
exports.export = async function (req, res, next) {
    const jsonexport = require('jsonexport');

    const limit = req.query.limit || 100;
    const key = req.query.key;
    const partnerName = req.query.partner || undefined;
    const format = req.query.format || 'json';
    const orderBy = req.query.order || 'DESC';

    if(key !== 'solar2022'){
        return res.json({message:'invalid key'});
    }
    const q = {
        include: [
            {
                model: models.closing_form_update,
                as: 'update',
                attributes:['toId','createdAt'],
                include:[ {
                    model: models.closing_form_update_type,
                    as: 'to',
                    attributes: ['name']
                }]
            },
            {
                required:true,
                model: models.contact,
                as: 'contact',
                attributes: ['id','partnerProposalId','firstName','lastName','primaryPhone'],
                include:[{
                    model: models.partner_proposal,
                    as: 'partnerProposals',
                    attributes:['partnerId','url'],
                    required:true,
                    include:[{
                        required:true,
                        model: models.partner,
                        as: 'partner',
                        attributes:['name','id']
                    }]
                },{
                    model: models.gen_type,
                    as: 'genType',
                    attributes:['name']
                },{
                    model: models.lender_proposal,
                    as: 'lenderProposals',
                    include:[ {
                        model: models.lender,
                        as: 'lender'
                    }]
                },{
                    model: models.user,
                    as: 'users',
                    attributes:['firstName','lastName','roleId','baseline'],
                    include:[ {
                        model: models.role,
                        as: 'role',
                        attributes:['slug']
                    }]
                }]
            }
        ],
        order: [
            ['id', orderBy]
        ]
    };

    if(partnerName){
        q.include[1].include[0].include[0].where = {name:partnerName}
    }

    const obj_array = await models.closing_form.findAll(q);

    const filtered = obj_array.filter(c => c.contact && c.contact.lender_proposals);

    const mapped = filtered.map((row)=>{
        const reps = row.contact.users
        const closers = reps.filter((u)=>{
            if(u.role.slug === 'closer'){
                return u;
            }
        });
        let closerBlock = '';
        let closerBaseline = 0;
        closers.forEach((cUser)=>{
            closerBlock += `${cUser.firstName} ${cUser.lastName} \n`;
            closerBaseline = cUser.baseline;
        })
        const setters = reps.filter((u)=>{
            if(u.role.slug === 'setter'){
                return u;
            }
        });
        let setterBlock = '';
        let setterBaseline = 0;

        setters.forEach((cUser)=>{
            setterBlock += `${cUser.firstName} ${cUser.lastName} \n`;
            setterBaseline = parseFloat(cUser.baseline);
        });
        let ppwNet = row.contact.lenderProposal.ppwNet;
        let totalCommission = (ppwNet - closerBaseline) * 1000;
        let closerCommission = totalCommission * .70;
        let SetterCommission = totalCommission * .30;
        let frontendPay = 1000;
        let backendPay = totalCommission - frontendPay;
        let incentives ='';
        let adders = '';


      ///  Total Commission - Frontend Pay = Backend Pay
        return {
          //  'partner':row.contact.partner_proposal.partner.name,
            'contactId':row.contact.id,
            'Contact First':row.contact.firstName,
            'Contact Last':row.contact.lastName,
            'Closer':closerBlock,
            'Setter':setterBlock,
            'System Size': row.contact.lenderProposal.systemSize,
            'Setter/Company Lead': row.contact.gen_type.name,
            'Rep FE Expected':frontendPay,
            'Rep BE Expected':backendPay,
            'FE Paid':'',
            'Rep BE Paid':'',
            'Setter FE Expected':'',
            'Setter BE Expected':'',
            'Setter FE Paid':'',
            'Setter BE Paid':'',
            'Adder Money':'',
            'Total Expected w/Adders':'',
            'Total Expected':'',
            'Total Paid':'',
            'Discrepancy Amount':'',
            'Discrepancy + Adders':'',
            'RL':'',
            'Net PPW':ppwNet,
            'GPPW':row.contact.lenderProposal.ppwGross,
            'PPW to be Paid':'',
            'Date Sold':row.contact.closeDate,
            'Incentives':incentives,
            'Adders':adders,
            'Link to Proposal':row.contact.partner_proposal.url
        }
    })




    if(format === 'json'){
        return res.json(mapped);
    }
    jsonexport(mapped, {rowDelimiter: ','}, function(err, csv){
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/csv');

            res.write(csv)

        res.end();
    });
}
exports.show = async function (req, res, next) {
    const loadedModel = req.loadedClosingForm;
    res.json(loadedModel);
}

exports.update = async function (req, res, next) {
    const id = req.params.closingFormId;

    const body  = req.body;
    await models.closing_form.update(body,{
        returning: true,
        plain: true,
        where:
            {
                id:id
            }});
    const newClosingForm = await models.closing_form.findByPk(id);
    res.status(201).json(newClosingForm);
}
exports.create = async function (req, res, next) {
    const {user, role} = req.token;


    const newClosingForm = req.body;
    const contactId = newClosingForm.contactId;
    const closingFormModel = await models.closing_form.findOne({
        where: {
            contactId: contactId
        }
    });

    const contactModel = await models.contact.findByPk(contactId);
    const contactUsers = await contactModel.getUsers();

    if(closingFormModel){
        const closingFormUsers = await closingFormModel.getUsers();
        const closingUserIds = closingFormUsers.map(c => c.id);
        for(let i = 0; i < contactUsers.length;i++){
            const contactUser = contactUsers[i];

            if(closingUserIds.indexOf(contactUser.id) === -1) {
                await closingFormModel.addUser(contactUser);
            }
        }


        closingFormModel.partnerId = newClosingForm.partnerId;
        closingFormModel.resubmitDate = new Date();
        const updateType = await models.closing_form_update_type.findOne({
            where:{
                slug:'resubmit'
            }
        });
        if(updateType) {
            const newClosingFormStatusUpdateModel = await models.closing_form_update.create({
                closingFormId:closingFormModel.id,
                note: newClosingForm.update.note,
                toId: updateType.id,
                userId: user
            });
            await newClosingFormStatusUpdateModel.save();
            closingFormModel.updateId = newClosingFormStatusUpdateModel.id;
        }
        await closingFormModel.save();
        return res.json(closingFormModel);
    }

    const updateType = await models.closing_form_update_type.findOne({
        where:{
            isDefault:1
        }
    });
    newClosingForm.submittedById = user;
    const newClosingFormModal = await models.closing_form.create(newClosingForm);
    const newClosingFormStatusUpdateModel = await models.closing_form_update.create({
        closingFormId:newClosingFormModal.id,
        note: newClosingForm.update.note,
        toId: updateType.id,
        userId: user
    });
    newClosingFormModal.updateId = newClosingFormStatusUpdateModel.id;
    for(let i = 0; i < contactUsers.length;i++){
        const contactUser = contactUsers[i];
        await newClosingFormModal.addUser(contactUser);
    }

    await newClosingFormModal.save();
    return res.json(newClosingFormModal);
}

exports.createStatusUpdate = async function (req, res, next) {
    const {user, role} = req.token;

    const newClosingFormStatusUpdate = req.body;
    const closingFormId = req.params.closingFormId;
    const closingFormModel = await models.closing_form.findByPk(closingFormId);
    newClosingFormStatusUpdate.userId = user;
    const updateType = await models.closing_form_update_type.findByPk(newClosingFormStatusUpdate.toId);
    if(!updateType || updateType.isActive === 0){
        return next({message:'Closing form status type does not exist'});
    }
    newClosingFormStatusUpdate.closingFormId = closingFormModel.id;
    const newClosingFormStatusUpdateModel = await models.closing_form_update.create(newClosingFormStatusUpdate);
    closingFormModel.updateId = newClosingFormStatusUpdateModel.id;
    await closingFormModel.save();

    if(updateType.slug === 'approved'){
        const defaultProjectUpdate = await models.project_update_type.findOne({
            where:{
                isDefault:true
            }
        });
        if(!defaultProjectUpdate){
            next({message:'Missing default status'});
            return;
        }
        let partnerId;
        let partnerUserId = null;
        if(!closingFormModel.partnerId){
            partnerId = closingFormModel.details.contact.partnerId;
        } else {
            partnerId = closingFormModel.partnerId;
        }
        const partnerUser = await models.user.findOne({where:{
                partnerId:partnerId
            }});
        if(partnerUser){
            partnerUserId = partnerUser.id;
        }

        const toId = {
            userId:closingFormModel.submittedById,
            toId:defaultProjectUpdate.id,
            note:''
        };
        const newProjectUpdateModel = await models.project_update.create(toId);
        const newProjectModel = await models.project.create({
            partnerId:closingFormModel.partnerId,
            closingFormId:closingFormModel.id,
            partnerUserId:partnerUserId,
            contactId:closingFormModel.contactId
        });
        newProjectModel.updateId = newProjectUpdateModel.id;

        const contactModel = await models.contact.findByPk(closingFormModel.contactId);



        const closeOption = await models.option.findOne({
            where :{
                slug:'close'
            }

        });
        const newUpdateModel = await models.contact_update.create({
            userId:closingFormModel.submittedById,
            contactId:contactModel.id,
            toId:closeOption.id
        });
        const currentDate =  moment().utc(true).format("YYYY-MM-DD HH:mm:ss");
        contactModel.set('updateId', newUpdateModel.id);
        contactModel.set('lastUpdateDate', currentDate);




        const users = await contactModel.getUsers();
        for(let i = 0; i < users.length;i++){
            let uu = await users[i];
            await newProjectModel.addUser(uu);
        }
        await contactModel.setClosed();

        const savedNewProject = await newProjectModel.save();
        newProjectUpdateModel.projectId = savedNewProject.id;
        await newProjectUpdateModel.save();
    }




    return res.json(newClosingFormStatusUpdateModel);
}

exports.listStatusUpdates = async function (req, res, next) {
    const {user, role} = req.token;

    const closingFormId = req.params.closingFormId;
    const closingFormModel = await models.closing_form.findByPk(closingFormId);
    const updates =await closingFormModel.listUpdates();
    return res.json(updates);
}



exports.destroy = async function (req, res,next) {
    const {user, role} = req.token;
    const id = req.params.closingFormId;
    if(!id || role !== 'admin'){
        return next({message:'Not authorized to perform this action'});
    }

    const closingForm = await models.closing_form.findByPk(id);
    const resp = await closingForm.destroy()
    return res.json({message:resp});


}
