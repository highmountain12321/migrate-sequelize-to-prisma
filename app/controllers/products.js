const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.list = async function (req, res, next) {
    const objArray = await prisma.product.findMany();
    res.json(objArray);
};

exports.show = async function (req, res, next) {
    const id = parseInt(req.params.id);
    const objArray = await prisma.product.findUnique({
        where: {
            id: id,
        },
    });
    res.json(objArray);
};

exports.update = async function (req, res, next) {
    const id = parseInt(req.params.id);
    const body = req.body;
    await prisma.product.update({
        where: {
            id: id,
        },
        data: body,
    });
    const newProposal = await prisma.product.findUnique({
        where: {
            id: id,
        },
    });
    res.status(201).json(newProposal);
};

exports.create = async function (req, res, next) {
    const { user, role } = req.token;
    const newProposal = req.body;
    newProposal.userId = user;

    const newProposalModal = await prisma.product.create({
        data: newProposal,
    });

    return res.json(newProposalModal);
};

exports.destroy = async function (req, res, next) {
    try {
        const id = parseInt(req.params.id);
        const response = await prisma.product.delete({
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
