const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.list = async function(req, res, next) {
    try {
        const objArray = await prisma.auto_action.findMany();
        res.json(objArray);
    } catch (error) {
        next(error);
    }
}

exports.listTypes = async function(req, res, next) {
    try {
        const objArray = await prisma.auto_action_type.findMany();
        res.json(objArray);
    } catch (error) {
        next(error);
    }
}

exports.show = async function(req, res, next) {
    try {
        const id = parseInt(req.params.actionId);
        const obj = await prisma.auto_action.findUnique({ where: { id: id } });
        res.json(obj);
    } catch (error) {
        next(error);
    }
}

exports.update = async function(req, res, next) {
    try {
        const id = parseInt(req.params.actionId);
        const body = req.body;

        const updatedObj = await prisma.automation.update({
            where: { id: id },
            data: body
        });
        
        res.status(200).json(updatedObj);
    } catch (error) {
        next(error);
    }
}

exports.create = async function(req, res, next) {
    try {
        const { user } = req.token;

        const automation = {
            ...req.body,
            userId: user
        };

        const newModel = await prisma.automation.create({ data: automation });
        res.json(newModel);
    } catch (error) {
        next(error);
    }
}

exports.destroy = async function(req, res, next) {
    try {
        const id = parseInt(req.params.actionId);
        await prisma.auto_action.delete({ where: { id: id } });
        res.json({ message: "Deleted successfully" });
    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.runJob = async function(req, res, next) {
    try {
        const typeId = parseInt(req.params.contactEventTypeId);
        const array = await prisma.contact_event.findMany({
            where: { typeId: typeId }
        });
        res.json(array);
    } catch (error) {
        console.log(error);
        next(error);
    }
}
