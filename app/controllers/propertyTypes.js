const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.list = async function (req, res, next) {
    const objArray = await prisma.propertyType.findMany({
        where: {
            isActive: true,
        },
        orderBy: {
            order: 'asc',
        },
    });
    res.json(objArray);
};

exports.create = async function (req, res, next) {
    if (req.body.id) {
        res.status(400).send(`Bad request: ID should not be provided, since it is determined automatically by the database.`);
    } else {
        const roofType = await prisma.propertyType.create({
            data: req.body,
        });
        return res.json(roofType);
    }
};

exports.update = async function (req, res, next) {
    const id = parseInt(req.params.id);
    const body = req.body;
    await prisma.propertyType.update({
        where: {
            id: id,
        },
        data: body,
    });
    const newProposal = await prisma.propertyType.findUnique({
        where: {
            id: id,
        },
    });
    res.status(201).json(newProposal);
};

exports.destroy = async function (req, res, next) {
    try {
        const id = parseInt(req.params.id);
        const response = await prisma.propertyType.delete({
            where: {
                id: id,
            },
        });
        res.json(response);
    } catch (e) {
        console.log(e);
        next(e);
    }
};
