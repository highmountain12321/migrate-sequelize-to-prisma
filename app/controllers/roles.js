
/**
 * Module dependencies.
 */

const { wrap: async } = require('co');
const { models } = require('../../sequelize');


exports.list = async function (req, res) {
    const list = await models.role.findAndCountAll({

    });
    res.json(list);
}


exports.show = async function (req, res) {
    const id = req.params.id;
    const obj = await models.role.findByPk( id);
    res.status(200).json(obj);
};



exports.count = async function (req, res) {
    const count = await models.role.count();
    res.json({
        count: count,
    })
}


exports.create = async function(req, res,next) {

    if (req.body.id) {
        res.status(400).send(`Bad request: ID should not be provided, since it is determined automatically by the database.`)
    } else {
        const role = await models.role.create(req.body);
        res.json(role);
    }

}

///role/roleId/users
exports.list_users_by_role = async function(req, res,next) {
    const role_id = req.params.id;
    const respo = await models.role.findOne({
        where: {
            id: role_id
        },
        include: {
            model: await models.user
        }
    });
    res.json(respo);

}


exports.update = async function (req, res, next) {
    const id = req.params.id;

    const body  = req.body;
    await models.role.update(body,{
        returning: true,
        plain: true,
        where:
            {
                id:id 
            }});
    const newProposal = await models.role.findByPk(id);
    res.status(201).json(newProposal);
}

exports.destroy = async function (req, res, next) {
    try {
        const id = req.params.id;
        const obj = await models.role.findByPk(id)
        const response = await obj.destroy()
        res.json(response);
    }catch(e){
        console.log(e);
        next(e);
    }
}


