const prisma = require('../../lib/prisma');

exports.list = async function (req, res, next) {
    try {
        const labels = await prisma.projectLabel.findMany();
        res.json(labels);
    } catch (error) {
        next(error);
    }
};

exports.show = async function (req, res, next) {
    try {
        const id = parseInt(req.params.id);
        const label = await prisma.projectLabel.findUnique({ where: { id } });
        if (label) {
            res.json(label);
        } else {
            res.status(404).send('Label not found');
        }
    } catch (error) {
        next(error);
    }
};

exports.update = async function (req, res, next) {
    try {
        const id = parseInt(req.params.id);
        const updatedLabel = await prisma.projectLabel.update({
            where: { id },
            data: req.body
        });
        res.status(201).json(updatedLabel);
    } catch (error) {
        next(error);
    }
};

exports.create = async function (req, res, next) {
    try {
        const newLabel = {
            ...req.body,
            userId: req.token.user
        };
        const createdLabel = await prisma.projectLabel.create({ data: newLabel });
        res.json(createdLabel);
    } catch (error) {
        next(error);
    }
};

exports.destroy = async function (req, res, next) {
    try {
        const id = parseInt(req.params.projectBoardId);
        await prisma.projectLabel.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        console.log(error);
        next(error);
    }
};
