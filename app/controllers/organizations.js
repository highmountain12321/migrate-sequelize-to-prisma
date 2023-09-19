const { wrap: async } = require('co');
const { models } = require('../../sequelize');

const _ = require('lodash');

exports.list = async function (req, res, next) {
    const {isActive = true} = req.query;
    const obj_array = await models.organization.findAndCountAll({where:{isActive}});
    res.json(obj_array);
}


exports.patchUser = async function(req, res,next) {
    const organizationId = req.params.organizationId;
    const obj = req.body;
    let userId = obj.add;
    if(obj.remove){
        userId = obj.remove;
    }
    try {
        const organizationModel = await models.organization.findByPk(organizationId);
        if(!organizationModel || organizationModel.isActive === false){
            return next({message:'Organization not active'});
        }
        const userModel = await models.user.findByPk(userId);
        if(!userModel || userModel.isActive === false){
            return next({message:'User not active'});
        }
        userModel.organizationId = organizationModel.id;
        await userModel.save();


        res.status(201).json(await organizationModel.reload());
    }catch(e){
        next({message:e.message});
    }
}

exports.show = async function (req, res, next) {
    const organizationModel = req.loadedOrganization;
    res.json(organizationModel);
}
exports.update = async function (req, res, next) {
    const organizationModel = req.loadedOrganization;
    const body  = req.body;
    await organizationModel.update(body,{
        returning: true,
        plain: true
    });
    const reloadedModel = await organizationModel.reload();
    res.status(201).json(reloadedModel);
}
exports.create = async function (req, res, next) {
    const userModel = req.userModel;
    const newObject = req.body;
    const newObjectModel = await models.organization.create(newObject);
    return res.json(newObjectModel);
}

exports.listUsers = async function (req, res, next) {
    const organizationModel = req.loadedOrganization;
    const {isActive = true} = req.query;
    const query = {
        order: [
            ['id', 'DESC']
        ],
        where:{isActive},
        attributes:['id','firstName','lastName','email','primaryPhone'],
        include:[{
            model: models.role,
            as: 'role',
            attributes: ['name']
        }]
    }

    const obj_array = await organizationModel.getUsers(query);
    res.json({rows:obj_array});
}
exports.listGroups = async function (req, res, next) {
    const organizationModel = req.loadedOrganization;
    const {isActive = true} = req.query;
    const query = {
        order: [
            ['id', 'DESC']
        ],
        where:{isActive},
        attributes:['id','name']
    }

    const obj_array = await organizationModel.getTeams(query);
    res.json({rows:obj_array});
}
exports.listContacts = async function (req, res, next) {
    const organizationModel = req.loadedOrganization;
    const {isActive = true} = req.query;
    const query = {
        attributes:['createdAt','id','firstName','lastName','primaryPhone','email','name','busName'],
        order: [
            ['id', 'DESC']
        ],
        include:[{
            attributes: [
                'id','toId','createdAt'
            ],
            required: false,
            separate: true,
            model: models.contact_update,
            order: [['id', 'DESC']],
            as: 'updates',
            limit: 1,
            include: [{
                attributes:['name','id'],
                model: models.option,
                as: 'to'
            }
            ]
        }],
        where:{isActive}
    }

    const obj_array = await organizationModel.getContacts(query);
    const getCount = await organizationModel.countContacts(query);
    res.json({rows:obj_array,count: getCount});
}

exports.deleteContact = async function (req, res,next) {
    try {
        const model = req.loadedContactModel;
        const defaultOrganization = await models.organization.findOne({
            where:{
                isDefault:true
            }
        })
        model.organizationId = defaultOrganization.id;
        await model.save();
        res.json(model);
    }catch(e){
        console.log(e);
        next(e);
    }
}
exports.deleteUser = async function (req, res,next) {
    try {
        const model = req.loadedUserModel;
        const defaultOrganization = await models.organization.findOne({
            where:{
                isDefault:true
            }
        })
        model.organizationId = defaultOrganization.id;
        await model.save();
        res.json(model);
    }catch(e){
        console.log(e);
        next(e);
    }
}


exports.destroy = async function (req, res,next) {
    try {
        const id = req.params.id;
        const obj = await models.organization.findByPk(id)
        const response = await obj.destroy()
        res.json(response);
    }catch(e){
        console.log(e);
        next(e);
    }
}
