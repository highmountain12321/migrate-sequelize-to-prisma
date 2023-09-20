const prisma = require('./path_to_your_shared_module/prismaClient');

// ... your route handlers using the `prisma` instance ...


// List
exports.list = async function(req, res, next) {
    try {
        const { autoTriggerId } = req.params;
        if (autoTriggerId) {
            const eventTriggerModel = await prisma.autoEventTrigger.findUnique({ where: { id: autoTriggerId } });
            const actionsModelArray = await prisma.action.findMany({ where: { eventTriggerId: autoTriggerId } });
            res.json(actionsModelArray);
            return;
        }
        const objArray = await prisma.autoEventTrigger.findMany();
        res.json(objArray);
    } catch (error) {
        console.log(error);
        next(error);
    }
}

// List Types
exports.listTypes = async function(req, res, next) {
    try {
        const objArray = await prisma.autoEventTriggerType.findMany();
        res.json(objArray);
    } catch (error) {
        console.log(error);
        next(error);
    }
}

// Show
exports.show = async function(req, res, next) {
    try {
        const id = req.params.eventTriggerId;
        const obj = await prisma.autoEventTrigger.findUnique({ where: { id } });
        res.json(obj);
    } catch (error) {
        console.log(error);
        next(error);
    }
}

// Update
exports.update = async function(req, res, next) {
    try {
        const id = req.params.eventTriggerId;
        const body = req.body;
        await prisma.automation.update({ where: { id }, data: body });
        const obj = await prisma.autoEventTrigger.findUnique({ where: { id } });
        res.status(201).json(obj);
    } catch (error) {
        console.log(error);
        next(error);
    }
}

// Create
exports.create = async function(req, res, next) {
    try {
        const { user, role } = req.token;
        const automation = req.body;
        automation.userId = user;
        const newModel = await prisma.automation.create({ data: automation });
        return res.json(newModel);
    } catch (error) {
        console.log(error);
        next(error);
    }
}

// Destroy
exports.destroy = async function(req, res, next) {
    try {
        const id = req.params.eventTriggerId;
        const response = await prisma.autoEventTrigger.delete({ where: { id } });
        res.json(response);
    } catch (error) {
        console.log(error);
        next(error);
    }
}
