const prisma = require('../lib/prisma');


exports.list = async function (req, res, next) {
    const objArray = await prisma.product_panel.findMany();
    res.json(objArray);
};

exports.show = async function (req, res, next) {
    const id = req.params.id;
    const objArray = await prisma.product_panel.findUnique({
        where: { id: parseInt(id) },
    });
    res.json(objArray);
};

exports.update = async function (req, res, next) {
    const id = req.params.id;
    const body = req.body;
    const updatedProposal = await prisma.product_panel.update({
        where: { id: parseInt(id) },
        data: body,
    });
    res.status(201).json(updatedProposal);
};

exports.create = async function (req, res, next) {
    const { user, role } = req.token;
    const newProposal = req.body;
    newProposal.userId = user;
    const newProposalModal = await prisma.product_panel.create({
        data: newProposal,
    });
    return res.json(newProposalModal);
};

exports.destroy = async function (req, res, next) {
    try {
        const id = req.params.id;
        await prisma.product_panel.delete({
            where: { id: parseInt(id) },
        });
        res.json({ message: 'Deleted successfully' });
    } catch (e) {
        console.error(e);
        next(e);
    }
};
