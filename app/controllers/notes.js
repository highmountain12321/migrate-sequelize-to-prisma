
/**
 * Module dependencies.
 */

const { wrap: async } = require('co');
const only = require('only');
const assign = Object.assign;
const _ = require('lodash');
const { models } = require('../../sequelize');


exports.list = async function (req, res) {
    const roles = await models.note.findAll();
    res.json({data: roles});
}


exports.fetch = async function (req, res) {
    const id = req.params.id;
    const obj = await models.note.findByPk( id);
    res.status(200).json({data:obj});
};



exports.count = async function (req, res) {
    const count = await models.note.count();
    res.json({
        count: count,
    })
}


exports.create = async function(req, res,next) {
    const {user, role} = req.token;


    if (req.body.id) {
        res.status(400).send(`Bad request: ID should not be provided, since it is determined automatically by the database.`)
    } else {
        req.body.userId = user;
        const data = await models.note.create(req.body);
        const newNote = await models.note.findByPk(data.id,{include:[
                {
                    model:models.user,
                    as:'user',
                    attributes:['firstName','lastName']
                },
            ]});
        res.status(201).json(newNote);
    }


}


exports.update = async function(req, res,next) {
    const id = req.params.id;
    if (req.body.id) {
        delete req.body.id;
    }
    const obj = await models.note.update(req.body, { where: { id: id } });
    res.status(201).json({data:obj});
    next();
};


exports.destroy = async function (req, res, next) {
    try {
        const id = req.params.id;
        const obj = await models.note.findByPk(id)
        const response = await obj.destroy()
        res.json({data: response});
    }catch(e){
        console.log(e);
        next(e);
    }
}


