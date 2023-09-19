'use strict';

/**
 * Module dependencies.
 */

const { wrap: async } = require('co');
const _ = require('lodash');

const { Op } = require("sequelize");
const assign = Object.assign;
const { models } = require('../../sequelize');




/**
 * List
 */

exports.list = async function (req, res, next) {
    const options = req.query.options
    if (!options) {
        return next({ message: 'missing options' });
    }

    const data = await models.option.findAll({
        where: {
            type: {
                [Op.in]: options.split(',')
            },
            isActive: true,
            isVisible: true
        },
        order: [
            ['order', 'ASC'],
        ],
        raw: true
    });
    const grouped = _.groupBy(data, function (option) {
        return option.type;
    });
    res.json(grouped);
}


exports.create = async function(req, res,next) {

    if (req.body.id) {
        res.status(400).send(`Bad request: ID should not be provided, since it is determined automatically by the database.`)
    } else {
        const role = await models.option.create(req.body);
        res.json(role);
    }

}

exports.update = async function (req, res, next) {
    const id = req.params.id;

    const body  = req.body;
    await models.option.update(body,{
        returning: true,
        plain: true,
        where:
            {
                id:id 
            }});
    const optionType = await models.option.findByPk(id);
    res.status(201).json(optionType);
}


exports.count = async function (req, res) {
    const data = await models.option.count();
    res.json({
        count: data,
    })
}



exports.show = async function (req, res) {
    const id = req.params.partner_id;
    const obj = await models.contact.findByPk(id);
    res.status(200).json({ data: obj });
};




exports.destroy = async function (req, res, next) {
    try {
        const id = req.params.id;
        const obj = await models.option.findByPk(id)
        const response = await obj.destroy()
        res.json({ data: response });
    } catch (e) {
        console.log(e);
        next(e);
    }
}



