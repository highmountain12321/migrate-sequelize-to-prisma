const prisma = require('../lib/prisma');


exports.list = async function (req, res, next) {
    const obj_array = await prisma.userGroup.findMany();
    res.json(obj_array);
};

exports.listUsers = async function (req, res, next) {
    // const obj_array = await prisma.userGroup.findAll();
    // res.json(obj_array);
}

exports.show = async function (req, res, next) {
    const id = parseInt(req.params.id);
    const obj_array = await prisma.userGroup.findUnique({
        where: {
            id: id,
        },
    });
    res.json(obj_array);
};

exports.update = async function (req, res, next) {
    const id = parseInt(req.params.id);
    const body = req.body;
    await prisma.userGroup.update({
        where: {
            id: id,
        },
        data: body,
    });
    const newProposal = await prisma.userGroup.findUnique({
        where: {
            id: id,
        },
    });
    res.status(201).json(newProposal);
};

exports.create = async function (req, res, next) {
    const userModel = req.userModel;
    const newProposal = req.body;
    newProposal.userId = userModel.id;
    const newProposalModal = await prisma.userGroup.create({
        data: newProposal,
    });
    return res.json(newProposalModal);
};

exports.destroy = async function (req, res, next) {
    try {
        const id = parseInt(req.params.id);
        await prisma.userGroup.delete({
            where: {
                id: id,
            },
        });
        res.json({ message: 'User group deleted successfully' });
    } catch (e) {
        console.log(e);
        next(e);
    }
};
