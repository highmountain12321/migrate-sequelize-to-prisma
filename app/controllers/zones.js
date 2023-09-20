const prisma = require('../lib/prisma');


exports.list = async function (req, res, next) {
    const obj_array = await prisma.zone.findMany();
    res.json(obj_array);
};

exports.show = async function (req, res, next) {
    const id = parseInt(req.params.id);
    const obj_array = await prisma.zone.findUnique({
        where: {
            id: id,
        },
    });
    res.json(obj_array);
};

exports.update = async function (req, res, next) {
    const id = parseInt(req.params.id);
    const body = req.body;
    await prisma.zone.update({
        where: {
            id: id,
        },
        data: body,
    });
    const newProposal = await prisma.zone.findUnique({
        where: {
            id: id,
        },
    });
    res.status(201).json(newProposal);
};

exports.create = async function (req, res, next) {
    const { user } = req.token;
    const newProposal = req.body;
    newProposal.userId = user;
    const newProposalModal = await prisma.zone.create({
        data: newProposal,
    });
    return res.json(newProposalModal);
};

exports.destroy = async function (req, res, next) {
    try {
        const id = parseInt(req.params.id);
        const obj = await prisma.zone.findUnique({
            where: {
                id: id,
            },
        });
        if (!obj) {
            return res.status(404).json({ message: 'Zone not found' });
        }
        const response = await prisma.zone.delete({
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
