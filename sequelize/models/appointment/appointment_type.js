const prisma = require('../lib/prisma');


exports.list = async function (req, res, next) {
    try {
        const objArray = await prisma.auto_action.findMany();
        res.json(objArray);
    } catch (error) {
        next(error);
    }
};

exports.listTypes = async function (req, res, next) {
    try {
        const objArray = await prisma.auto_action_type.findMany();
        res.json(objArray);
    } catch (error) {
        next(error);
    }
};

exports.show = async function (req, res, next) {
    const id = parseInt(req.params.actionId, 10);
    try {
        const obj = await prisma.auto_action.findUnique({ where: { id } });
        res.json(obj);
    } catch (error) {
        next(error);
    }
};

exports.update = async function (req, res, next) {
    const id = parseInt(req.params.actionId, 10);
    const body = req.body;
    try {
        const updatedAutomation = await prisma.automation.update({
            where: { id },
            data: body,
        });
        const obj = await prisma.auto_action.findUnique({ where: { id } });
        res.status(201).json(obj);
    } catch (error) {
        next(error);
    }
};

exports.create = async function (req, res, next) {
    const { user } = req.token;
    const automation = {
        ...req.body,
        userId: user,
    };
    try {
        const newModel = await prisma.automation.create({ data: automation });
        res.json(newModel);
    } catch (error) {
        next(error);
    }
};

exports.destroy = async function (req, res, next) {
    const id = parseInt(req.params.actionId, 10);
    try {
        const obj = await prisma.auto_action.delete({ where: { id } });
        res.json(obj);
    } catch (error) {
        console.log(error);
        next(error);
    }
};
