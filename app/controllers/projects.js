'use strict';

/**
 * Module dependencies.
 */

const { wrap: async } = require('co');
const only = require('only');
const moment = require('moment');
const {Op} = require("sequelize");

const assign = Object.assign;
const { models } = require('../../sequelize');




/**
 * List
 */

exports.list = async function (req, res) {
    const limit = req.query.limit || 100;
    const offset = req.query.offset || 0;
    const order = req.query.order || 'DESC';

    const {user, role} = req.token;
    const i = [{
        model:models.role,
        as:'role'
    },{
        model:models.partner,
        required:false,
        as:'partner'
    }]

    const where = {
        [Op.or]: [{
            'partnerUserId': user,
            isActive: true
        }]
    }


    const projects = await models.project.findAll({
        where: where,
        attributes:[
            'id',
            'partnerUserId',
            'updateId',
            'contactId',
            'createdAt',
            'partnerId',
        ],
        order: [
            ['id', order]
        ],
        include:[{
            attributes:['note','createdAt'],
            model: models.project_update,
            as:'update',
            include: [{
                model: models.project_update_type,
                as: 'to',
                attributes:['name','id']
            }]
        },{
            model:models.user,
            attributes:['firstName','partnerId'],
            as:'partnerUser',
            include:[{
                attributes:['name'],
                model: models.partner,
                as:'partner'
            }]
        },{
            as:'contact',
            model:models.contact,
            attributes:[
                'primaryPhone',
                'firstName',
                'lastName',
                'address1',
                'city','state','postalCode'
            ]
        }]
    });
    res.json(projects);
}


exports.count = async function (req, res) {
    const count = await models.partner.count();
    res.json({
        count: count,
    })
}






exports.create = async function (req, res, next) {
    const project = req.body;
    const userModel = req.userModel;
    project.ownerId = userModel.id;
    const newProjectModel = await models.project.create(project);
    return res.json(newProjectModel);
}

exports.update = async function (req, res) {

    const id = req.params.projectId;
    if (req.body.id) {
        res.status(400).send(`Bad request: ID should not be provided, since it is determined automatically by the database.`)
        return;
    }
    const obj = await models.project.update(req.body, { where: { id: id } });
    res.status(201).json(obj);

}


exports.show = async function (req, res) {
    const id = req.params.projectId;
    const obj = await models.project.findByPk( id,{
        include:[{
            attributes:['firstName','lastName','primaryPhone','roleId'],
            model: models.user,
            as:'users',
            include: [{
                model: models.role,
                as: 'role',
                attributes:['name']
            }]
        },{
            attributes:['note','createdAt'],
            model: models.project_update,
            as:'update',
            include: [{
                model: models.project_update_type,
                as: 'to',
                attributes:['name','id']
            }]
        },{
            as:'contact',
            model:models.contact,
            include:[{
                attributes:['url'],
                model: models.partner_proposal,
                as:'partnerProposals'
            },{
                model: models.hoa,
                as:'hoa'
            }],

            attributes:[
                'id',
                'primaryPhone',
                'secondaryPhone',
                'email',
                'firstName',
                'lastName',
                'address1',
                'address2',
                'city','state','postalCode']
        }]
    });
    res.status(200).json(obj);
};




exports.listTypes  = async function(req, res,next) {
    const obj_array = await models.project_update_type.findAll({
        where:{
            isActive:1,
            isVisible:1
        },
        order: [
            ['order', 'ASC']
        ]
    });
    res.json(obj_array);
}


exports.listDocuments = async function(req, res,next) {
    const id = req.params.projectId;
    const where = req.params.filter;
    const query = {
        where:{
            id:id,
        },
        attributes: ['id'],
        include: [{
            model: models.document,
            as: 'documents',
            attributes: ['originalName','id','typeId','createdAt'],
            include:[{
                attributes: ['name','slug'],
                model: models.document_type,
                as: 'type'
            }]
        }]};
    const obj = await models.project.findOne(query);
    res.status(200).json(obj);
}


exports.createUpdate = async function(req, res,next) {
    const {user, role} = req.token;

    const newUpdate  = req.body;
    const id = req.params.projectId;
    newUpdate.userId = user;
    if(!newUpdate.toId){
        return res.json({});
    }

    const newUpdateModel = await models.project_update.create(newUpdate);
    newUpdateModel.projectId = id;
     await newUpdateModel.save();

    const projectModel = await models.project.findByPk(newUpdateModel.projectId);




    projectModel.updateId = newUpdateModel.id;

    await projectModel.save();
    res.json({ok:true});

}

exports.listProjects = async function(req, res,next) {
    const id = req.loadedBoardModel

    const updates = await models.project_update.findAll({
        order: [
            ['id', 'DESC']
        ],
        where:{
            projectId: id
        },
        attributes:['toId','createdAt','note'],
        include:[{
            model:models.user,
            as: 'user',
            attributes:['firstName','lastName']
        },{
            model:models.project_update_type,
            as: 'to',
            attributes:['name']
        }]
    })
    res.status(200).json(updates);

}


exports.listUpdates = async function(req, res,next) {
    const id = req.params.projectId;

    const updates = await models.project_update.findAll({
        order: [
            ['id', 'DESC']
        ],
        where:{
            projectId: id
        },
        attributes:['toId','createdAt','note'],
        include:[{
            model:models.user,
            as: 'user',
            attributes:['firstName','lastName']
        },{
            model:models.project_update_type,
            as: 'to',
            attributes:['name']
        }]
    })
    res.status(200).json(updates);

}




exports.destroy = async function (req, res, next) {
    try {
        const id = req.params.projectId;
        const obj = await models.project.findByPk(id)
        const response = await obj.destroy()
        res.json({data: response});
    }catch(e){
        console.log(e);
        next(e);
    }
}


