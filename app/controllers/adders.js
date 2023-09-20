const prisma = require('../lib/prisma');

exports.list = async function (req, res, next) {
    try {
        const adders = await prisma.adder.findMany();
        res.json(adders);
    } catch (error) {
        next(error);
    }
};

exports.show = async function (req, res, next) {
    try {
        const id = parseInt(req.params.id);
        const adder = await prisma.adder.findUnique({
            where: { id }
        });
        res.json(adder);
    } catch (error) {
        next(error);
    }
};

exports.update = async function (req, res, next) {
    try {
        const id = parseInt(req.params.id);
        const updatedAdder = await prisma.adder.update({
            where: { id },
            data: req.body
        });
        res.status(201).json(updatedAdder);
    } catch (error) {
        next(error);
    }
};

exports.create = async function (req, res, next) {
    try {
        const { user } = req.token;
        const newAdder = {
            ...req.body,
            userId: user
        };
        const createdAdder = await prisma.adder.create({
            data: newAdder
        });
        res.json(createdAdder);
    } catch (error) {
        next(error);
    }
};

exports.destroy = async function (req, res, next) {
    try {
        const id = parseInt(req.params.adderId);
        const deletedAdder = await prisma.adder.delete({
            where: { id }
        });
        res.json(deletedAdder);
    } catch (error) {
        console.log(error);
        next(error);
    }
};
