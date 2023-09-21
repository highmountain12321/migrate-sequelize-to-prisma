'use strict';

const prisma = require('../lib/prisma');

const _ = require('lodash');

exports.list = async function (req, res, next) {
    try {
        const obj_array = await prisma.disposition.findMany({
            where: {
                isActive: true
            }
        });

        const grouped = _.chain(obj_array)
            .groupBy("group")
            .map((value, key) => ({ key: key, items: value }))
            .value();

        res.json({data: grouped});
    } catch (error) {
        next(error);
    }
}

exports.create = async function (req, res, next) {
    try {
        const body = req.body;
        const obj_array = await prisma.disposition.create({
            data: body
        });
        res.json({data: obj_array});
    } catch (error) {
        console.error(error);
        next(error);
    }
}

exports.destroy = async function (req, res, next) {
    try {
        const id = parseInt(req.params.id);
        await prisma.disposition.delete({ where: { id: id } });
        res.json({message: "Deleted successfully"});
    } catch (error) {
        console.log(error);
        next(error);
    }
}
