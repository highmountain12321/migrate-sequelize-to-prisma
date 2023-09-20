
/**
 * Module dependencies.
 */

const { wrap: async } = require('co');
const only = require('only');
const assign = Object.assign;
const _ = require('lodash');
const { models } = require('../../sequelize');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
// Other required modules remain unchanged

exports.list = async function (req, res) {
    const list = await prisma.hoa.findMany();
    res.json(list);
}

exports.fetch = async function (req, res) {
    const id = parseInt(req.params.id, 10);
    const obj = await prisma.hoa.findUnique({ where: { id: id } });
    res.status(200).json(obj);
}

exports.count = async function (req, res) {
    const count = await prisma.hoa.count();
    res.json({ count: count });
}

exports.create = async function(req, res, next) {
    if (req.body.id) {
        res.status(400).send(`Bad request: ID should not be provided, since it is determined automatically by the database.`);
    } else {
        const hoa = await prisma.hoa.create({ data: req.body });
        res.status(201).json(hoa);
    }
}

exports.update = async function(req, res, next) {
    const id = parseInt(req.params.id, 10);
    if (req.body.id) {
        delete req.body.id;
    }

    try {
        const updatedHoa = await prisma.hoa.update({
            where: { id: id },
            data: req.body
        });
        res.status(201).json(updatedHoa);
    } catch (error) {
        if (error.code === 'P2025') {
            return next({ message: 'Record is missing' });
        }
        next(error);
    }
}

exports.destroy = async function (req, res, next) {
    try {
        const id = parseInt(req.params.id, 10);
        const response = await prisma.hoa.delete({ where: { id: id } });
        res.json(response);
    } catch (e) {
        console.log(e);
        next(e);
    }
}
