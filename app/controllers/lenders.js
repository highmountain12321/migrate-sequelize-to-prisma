const prisma = require('../lib/prisma');


const _ = require('lodash');

exports.list = async function (req, res, next) {
    const { isActive = true } = req.query;
    try {
        const lenders = await prisma.lender.findMany({ where: { isActive: Boolean(isActive) } });
        const count = await prisma.lender.count({ where: { isActive: Boolean(isActive) } });
        res.json({ count, rows: lenders });
    } catch (error) {
        next(error);
    }
}

exports.show = async function (req, res, next) {
    const id = parseInt(req.params.id, 10);
    try {
        const lender = await prisma.lender.findUnique({ where: { id: id } });
        res.json(lender);
    } catch (error) {
        next(error);
    }
}

exports.update = async function (req, res, next) {
    const id = parseInt(req.params.id, 10);
    const body = req.body;
    try {
        const updatedLender = await prisma.lender.update({
            where: { id: id },
            data: body
        });
        res.status(201).json(updatedLender);
    } catch (error) {
        next(error);
    }
}

exports.create = async function (req, res, next) {
    const { user, role } = req.token;

    const newLenderData = {
        ...req.body,
        userId: user
    };

    try {
        const newLender = await prisma.lender.create({ data: newLenderData });
        res.json(newLender);
    } catch (error) {
        next(error);
    }
}

exports.destroy = async function (req, res, next) {
    const id = parseInt(req.params.id, 10);
    try {
        const deletedLender = await prisma.lender.delete({ where: { id: id } });
        res.json(deletedLender);
    } catch (e) {
        console.log(e);
        next(e);
    }
}
