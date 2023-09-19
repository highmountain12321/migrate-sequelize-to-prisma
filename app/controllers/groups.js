'use strict';

/**
 * Module dependencies.
 */

const { wrap: async } = require('co');
const _ = require('lodash');
const { models } = require('../../sequelize');
const {QueryTypes,Op} = require("sequelize");
const Sequelize = require('sequelize');
const {Services} = require("../services");

exports.listClosingForms = async function (req, res, next) {
    const {isActive = true } = req.query;

    try {
        const id = req.params.groupId;
        const userGroupModel = req.loadedUserGroupModel
        const contacts = await userGroupModel.getContacts({
            attributes:['id'],
            include:[
                {
                    where:{
                        isActive
                    },
                    model: models.closing_form,
                    as: 'closingForms',
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
                            }]
                        },
                        {
                            model: models.contact,
                            as: 'contact',
                            attributes: ['firstName','lastName','email','primaryPhone','busName'],
                            include:[{
                                model: models.contact_system,
                                as: 'system'
                            },{
                                model: models.gen_type,
                                as: 'genType',
                                attributes:['name']
                            }, {
                                model: models.partner_proposal,
                                as: 'partnerProposals',
                                include:[ {
                                    model: models.partner,
                                    as: 'partner',
                                    attributes:['name','id']
                                }]
                            },{
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
                            }]
                        }
                    ],
                    order: [
                        ['id', 'DESC']
                    ]
                }
            ]
        });
        let closingForms = [];

        for(let i = 0; i < contacts.length;i++){
            if(contacts[i].closingForms) {
                closingForms = [...closingForms, ...contacts[i].closingForms];
            }
        }
        res.json({rows: closingForms, count:closingForms.length });
    }catch(e){
        console.error(e);
        next(e);
    }

}
exports.list = async function (req, res) {
    const {isActive = true, type, isManager = false, q, name, organizationFilter} = req.query;
    const userModel = req.userModel;


    const where ={
        isActive,
    };



    if (q && q.length > 0) {
        where[Op.or] = Services.Search.teamName(q);
    }
    if (name && name.length > 0) {
        where[Op.or] = Services.Search.teamName(name);
    }



    const query = {
        where,
            attributes: [
        "isActive",
        "id",
        "name",
        'typeId',
        'isDefault',
        'description'
    ],
        include: [
        {
            as: "type",
            attributes: ['id','name','slug'],
            model: models.user_group_type,
        },     {
                as: "organization",
                attributes: ['id','name'],
                model: models.organization,
            }
    ],
        order: [
        ['id', 'DESC']
    ]
    }



    if(organizationFilter){
        const organizationInclude = (_.find(query.include, { as: 'organization' }));
        organizationInclude.required = true;
        organizationInclude.where = {
            id: organizationFilter.toString().indexOf(',') > -1 ? organizationFilter.split(',') : [organizationFilter]
        }
    }

    if(type){
        const typeInclude = (_.find(query.include, { as: 'type' }));
        typeInclude.required = true;
        typeInclude.where = {
            slug: type
        }
    }

    if(userModel.isAdmin()){
        const allGroups = await models.user_group.findAndCountAll(query);
        res.json(allGroups);
        return;
    }
    if(isManager === true){
        const managedGroups = await userModel.getManagedGroups(query);
        const managedGroupsCount = await userModel.countManagedGroups(query);
        res.json({rows: managedGroups, count: managedGroupsCount});
        return;
    }
    const userGroups = await userModel.getGroups(query);
    res.json({rows: userGroups});
    return;


}
exports.listTypes = async function (req, res) {
    const objArray = await models.user_group_type.findAll({where:{
        isActive:true
        }});
    if(!objArray){
        return  res.json({rows:[],count: 0});
    }
    res.json({rows:objArray,count: objArray.length});
}
exports.listBoards = async function (req, res) {
    const id = req.params.groupId;
    const userGroupModel = req.loadedUserGroupModel
    const boards = await userGroupModel.getBoards();
    res.json({rows:boards});
}

exports.createBoard = async function (req, res) {
    const id = req.params.groupId;
    const userGroupModel = req.loadedUserGroupModel
    const boards = await userGroupModel.listBoards();
    res.json({rows:boards});
}



exports.listUsers = async function (req, res) {
    const id = req.params.groupId;
    const userGroupModel = req.loadedUserGroupModel
    const {role, isActive = true, limit, offset, q} = req.query;

    const where = {
        isActive,
    }
    if(q && q.length > 1){
        where[Op.or] = Services.Search.query(q);
    }

    const query = {
        order: [
            ['id', 'DESC']
        ],
        where,
        attributes:['createdAt','id','firstName','lastName','primaryPhone','email','picUrl'],
        include:[{
            attributes:['name'],
            model:models.role,
            as:'role'
        }]
    }

    if(role){
        const roleInclude = (_.find(query.include, { as: 'role' }));
        roleInclude.required = true;
        roleInclude.where = {
            slug: role
        }
    }


    const rows = await userGroupModel.getUsers(query)
    const count = await userGroupModel.countUsers(query)

    res.json({rows, count});
}
exports.listManagers = async function (req, res) {
    const {isActive = true, limit = 1000, offset = 0, q} = req.query;

    const where = {
        isActive,
    }
    if(q && q.length > 1){
        where[Op.or] = Services.Search.query(q);
    }



    const userGroupModel = req.loadedUserGroupModel;
    const query = {
        where,
        attributes:['createdAt','id','firstName','lastName','primaryPhone','email','picUrl'],
        include:[{
            attributes:['name'],
            model:models.role,
            as:'role'
        }]
    };





    const rows = await userGroupModel.getManagers(query);
    const count = await userGroupModel.countManagers(query);
    res.json({rows, count});
}


exports.showContact = async function(req, res,next) {
    const groupId = req.params.groupId;
    const contactId = req.params.contactId;
    const {user, role} = req.token;
    const contactModel = await models.contact.findByPk( contactId,{
        order:[
            [ 'id', 'DESC']
        ],
        include:[{
            model: models.document,
            as:'documents',
            include:[{
                model: models.document_type,
                as:'type',
                attributes:['name','slug'],
            }]
        },{
            model: models.lender_proposal,
            as:'lenderProposals',
            attributes:['months','years','rate','loanAmount','systemPrice','isCash', 'cashAmount','id','ppwNet','ppwGross','systemSize'],
            include:[{
                model: models.lender,
                as:'lender',
                attributes:['name'],
            }]
        },{
            model: models.partner_proposal,
            as:'partnerProposals',
            attributes:['url'],
            include:[{
                model: models.partner,
                as:'partner',
                attributes:['id','name','userId'],
            }]
        },{
            model: models.contact_update,
            as:'updates',
            attributes:['note','createdAt','id'],
            include: [{
                model: models.option,
                as: 'from',
                attributes:['name','id']

            },{
                model: models.user,
                as: 'user',
                attributes:['id','firstName','lastName']
            }, {
                model: models.option,
                as: 'to',
                attributes:['name','id','slug'],
            }]
        },{
            model:models.gen_type,
            as:'genType',
            attributes:['name','slug','id']
        },{
            model:models.roof_type,
            as:'roofType',
            attributes:['name']
        },{
            model:models.user,
            as:'users',
            attributes:['id','firstName','lastName','picUrl','primaryPhone','email'],
            include: [{
                model: models.role,
                as: 'role',
                attributes:['name','slug']

            }],
        },
            {
                model:models.contact_source,
                as:'source',
            },{
                model:models.contact_type,
                as:'type',
            },{
                model:models.hoa,
                as:'hoa',
            },
            {model: models.appointment, include: ['user'], as:'appointments'},
        ]});
    if(!contactModel){
        return next({message:'Homeowner not found'});
    }
    if(!contactModel.users){
        return next({message:'No users assigned'})
    }
    const userIds = contactModel.users.map( u => parseFloat(u.id));


    res.status(200).json(contactModel);
}
exports.listCounts = async function (req,res){
    const contactCount = await models.user_group.findByPk(id, {
        raw: true,
        nest: true,
        attributes: [
            "id",
            [Sequelize.fn("COUNT", Sequelize.col("contacts.id")), "contactCount"],
        ],
        include: [
            {
                where: {
                    isActive:true
                },
                as: "contacts",
                model: models.contact,
                attributes: [],
            }
        ],
        group: ["user_group.id"],
    });
}
exports.listContacts = async function (req, res) {
    const loadedUserGroupModel = req.loadedUserGroupModel;
    const {stageId,propertyType, isActive=true, limit=1000, offset=0, q} = req.query;


    const where = {
        isActive,
    }
    if(q && q.length > 1){
        where[Op.or] = Services.Search.query(q);
    }
    if(propertyType && propertyType.toLowerCase() === 'commercial'){
        where.propertyTypeId = 2;
    }
    if(propertyType && propertyType.toLowerCase() === 'residential'){
        where.propertyTypeId = 1;
    }


    const query = {
        where,
        required:false,
        order: [
            ['id', 'DESC'],
            [ {model:models.contact_update, as:'updates'}, 'id', 'DESC' ],
        ],
        include:[{
            order: [
                ['id', 'DESC']
            ],
            attributes:['createdAt','id'],
            model: models.contact_update,
            as:'updates',
            include: [{
                model: models.option,
                as: 'to'
            }]
        },{
            attributes:['id','name'],
            model: models.contact_stage,
            as:  'stage',
        },{
            model: models.user,
            as: 'users',
            attributes:['firstName','lastName','primaryPhone','email','roleId','id','picUrl'],
            include:[{
                model: models.role,
                as: 'role',
            }]
        }]

    }

    if(stageId){
        const stageInclude = (_.find(query.include, { as: 'stage' }));
        stageInclude.required = true;
        stageInclude.where = {
            id: stageId
        }
    }


   // const count = await group.countContacts(query);


    const count = await loadedUserGroupModel.countContacts(query);
    query.limit = limit || 25;
    query.offset =  offset || 0;
    const rows = await loadedUserGroupModel.getContacts(query);




    return res.json({rows, count});
}


exports.count = async function (req, res) {
    const count = await models.user_group.count();
    res.json({
        count: count,
    })
}



exports.create = async function(req, res,next) {

    const group = req.body;
    try {
        if (req.body.id) {
            res.status(400).send(`Bad request: ID should not be provided, since it is determined automatically by the database.`)
        } else {
            const newGroupModel = await models.user_group.create(group,{
                include: [
                    {
                        as:'organization',
                        model: models.organization
                    }]
            });
            if(newGroupModel.isDefault){
               await models.user_group.update( { isDefault:false },{
                    where: {
                        id : {[Op.ne]: newGroupModel.id},
                    }
                });
            }
            res.status(201).json(await newGroupModel.reload({
                include:[
                    {
                        as:'organization',
                        model: models.organization
                    }
                ]}));
        }
    }catch(e){
        console.log(e);
        next({message:e.message});
    }

}



exports.patchUser = async function(req, res,next) {
    const groupId = req.params.groupId;
    const obj = req.body;
    let userId = obj.add;
    if(obj.remove){
        userId = obj.remove;
    }
    try {
        const groupModel = await models.user_group.findByPk(groupId);
        if(!groupModel || groupModel.isActive === false){
            return next({message:'Group is not active'});
        }
        const userModel = await models.user.findByPk(userId);
        if(!userModel || userModel.isActive === false){
            return next({message:'User is not active'});
        }
        userModel.organizationId = groupModel.organizationId;
        await userModel.save();
        if(obj.add) {
            await groupModel.addUser(userModel.id);
        }
        if(obj.remove){
            await groupModel.removeUser(userId);
        }

        res.status(201).json(await groupModel.reload());
    }catch(e){
        next({message:e.message});
    }
}
exports.patchManager = async function(req, res,next) {
    const groupId = req.params.groupId;
    const obj = req.body;
    let userId = obj.add;
    if(obj.remove){
        userId = obj.remove;
    }
    try {
        const groupModel = await models.user_group.findByPk(groupId);
        if(!groupModel || groupModel.isActive === false){
            return next({message:'Group is not active'});
        }
        const userModel = await models.user.findByPk(userId);
        if(!userModel || userModel.isActive === false){
            return next({message:'User is not active'});
        }
        userModel.organizationId = groupModel.organizationId;
        await userModel.save();
        if(obj.add) {
            await groupModel.addManager(userId);
        }
        if(obj.remove){
            await groupModel.removeManager(userId);
        }

        res.status(201).json(groupModel);
    }catch(e){
        next({message:e.message});
    }

}

exports.patchContact = async function(req, res,next) {
    const groupId = req.params.groupId;
    const obj = req.body;
    let id = obj.add;
    if(obj.remove){
        id = obj.remove;
    }
    try {
        const groupModel = await models.user_group.findByPk(groupId);
        if(!groupModel || groupModel.isActive === false){
            return next({message:'Group is not active'});
        }
        const contactModel = await models.contact.findByPk(id);
        if(!contactModel || contactModel.isActive === false){
            return next({message:'Contact is not active'});
        }
        if(obj.add) {
            const idArray = Array.isArray(id) ? id : [id];
            for(let i = 0; i < idArray.length; i++){
                const cModel = await models.contact.findByPk(idArray[i]);
                await groupModel.addContact(cModel);
                await cModel.addGroup(groupModel)
                await cModel.save();
            }

        }
        if(obj.remove){
            const idArray = Array.isArray(id) ? id : [id];
            for(let i = 0; i < idArray.length; i++){
                const cModel = await models.contact.findByPk(idArray[i]);
                await groupModel.removeContact(cModel);
                await cModel.removeGroup(groupModel)

            }
        }

        res.status(201).json(groupModel);
    }catch(e){
        next({message:e.message});
    }
}


exports.deleteUser = async function(req, res,next) {
    const groupId = req.params.groupId;
    const userId = req.params.userId;
    try {
        const group = await models.user_group.findByPk(groupId);
        if(!group || group.isActive === false){
            return next({message:'Group is not active'});
        }

        await group.removeUser(userId);

        res.status(201).json(group);
    }catch(e){
        next({message:e.message});
    }

}
exports.deleteContact = async function(req, res,next) {
    const groupId = req.params.groupId;
    const contactId = req.params.contactId;

    const obj = req.body;
    try {
        const group = await models.user_group.findByPk(groupId);
        if(!group || group.isActive === false){
            return next({message:'Group is not active'});
        }

        await group.removeContact(contactId);

        res.status(201).json(group);
    }catch(e){
        next({message:e.message});
    }

}




exports.createContact = async function(req, res,next) {
    const groupId = req.params.groupId;
    const obj = req.body;
    try {
        const groupModel = await models.user_group.findByPk(groupId);
        if(!groupModel || groupModel.isActive === false){
            return next({message:'Group is not active'});
        }
        const contactModel = await models.contact.findByPk(obj.contactId);
        if(!contactModel || contactModel.isActive === false){
            return next({message:'Contact is not active'});
        }
        contactModel.organizationId = groupModel.organizationId;
        await groupModel.addContact(contactModel);
        await contactModel.save();

        res.status(201).json(groupModel);
    }catch(e){
        next({message:e.message});
    }

}




/**
 * Update contact
 */

exports.update = async function(req, res,next) {
    const id = req.params.groupId;
    const body = req.body;

    if(body.isDefault === true){
         await models.user_group.update({isDefault:false}, { where: { isDefault: true } });
    }
    if(body.isDefault === false){
       const userGroups = await models.user_group.findAll({ where: { isDefault: true } });
       if(userGroups.length === 0){
           return next({message:'Atleast 1 user team must be default'});
       }
    }
    const obj = await models.user_group.update(body, {
        where: { id: id },
        include:[
            {
                model: models.organization,
                as: 'organization',
            }]
    });
    const userGroupObject = await models.user_group.findByPk(id,{
        include:[
            {
                model: models.organization,
                as: 'organization',
            }]
    });
    if(body.organization) {
        await userGroupObject.setOrganization(body.organization.id);
    }
    res.status(201).json(await userGroupObject.reload());
}



exports.show = async function (req, res) {
    const id = req.params.groupId;
    const obj = await models.user_group.findByPk(id,{
        include:[
            {
                model: models.organization,
                as: 'organization'
            }]
    });
    res.status(200).json(obj);
};

exports.destroy = async function (req, res, next) {
    try {
        const id = req.params.groupId;
        const obj = await models.user_group.findByPk(id);
        const response = await obj.destroy()
        res.json({data: response});
    }catch(e){
        console.log(e);
        next(e);
    }
}

