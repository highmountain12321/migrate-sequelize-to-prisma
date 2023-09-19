
/**
 * Module dependencies.
 */

const { wrap: async } = require('co');
const only = require('only');
const assign = Object.assign;
const _ = require('lodash');
const { models } = require('../../sequelize');


exports.list = async function (req, res) {
    const list = await models.hoa.findAll();
    res.json(list);
}


exports.fetch = async function (req, res) {
    const id = req.params.id;
    const obj = await models.hoa.findByPk( id);
    res.status(200).json(obj);
};



exports.count = async function (req, res) {
    const count = await models.hoa.count();
    res.json({
        count: count,
    })
}


exports.create = async function(req, res,next) {

    if (req.body.id) {
        res.status(400).send(`Bad request: ID should not be provided, since it is determined automatically by the database.`)
    } else {
        const hoa = await models.hoa.create(req.body,{ returning: true});
        res.status(201).json(hoa);
    }

}


exports.update = async function(req, res,next) {
    const id = req.params.id;
    if (req.body.id) {
        delete req.body.id;
    }
    let obj = await models.hoa.findByPk(id);
    if (!obj) {
        return next({message:'Record is missing'});
    }
    const newObj = await obj.update(req.body);
    res.status(201).json(newObj);
};


exports.destroy = async function (req, res, next) {
    try {
        const id = req.params.id;
        const obj = await models.hoa.findByPk(id)
        const response = await obj.destroy()
        res.json(response);
    }catch(e){
        console.log(e);
        next(e);
    }
}


