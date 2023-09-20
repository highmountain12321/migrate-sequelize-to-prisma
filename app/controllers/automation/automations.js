const prisma = require('../../lib/prisma');

// List
exports.list = async function(req, res, next) {
    try {
        const params = req.query;

        let query = {
            include: {
                trigger: true,
                action: true,
                targetUser: true,
                targetGroup: true
            }
        };

        if (params.actionId) {
            query.where = {
                actionId: Number(params.actionId)
            };
        }

        const objArray = await prisma.autoAutomation.findMany(query);
        res.json(objArray);

    } catch (error) {
        console.log(error);
        next(error);
    }
}

// Show
exports.show = async function(req, res, next) {
    try {
        const id = Number(req.params.automationId);
        const obj = await prisma.autoAutomation.findUnique({ where: { id } });
        res.json(obj);
    } catch (error) {
        console.log(error);
        next(error);
    }
}

// Update
exports.update = async function(req, res, next) {
    try {
        const id = Number(req.params.automationId);
        const body = req.body;

        await prisma.autoAutomation.update({ 
            where: { id },
            data: body, 
            include: {
                trigger: true,
                action: true,
                targetUser: true,
                contactSource: true, // Note: you also mentioned contactSource here
                targetGroup: true
            }
        });
        
        const updatedObj = await prisma.autoAutomation.findUnique({ where: { id } });
        res.status(201).json(updatedObj);

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
        automation.creatorId = user;

        const newModel = await prisma.autoAutomation.create({
            data: automation,
            include: {
                trigger: true,
                action: true,
                targetUser: true,
                targetGroup: true
            }
        });

        res.json(newModel);

    } catch (error) {
        console.log(error);
        next(error);
    }
}

// Destroy
exports.destroy = async function(req, res, next) {
    try {
        const id = Number(req.params.automationId);
        const response = await prisma.autoAutomation.delete({ where: { id } });
        res.json(response);
    } catch (error) {
        console.log(error);
        next(error);
    }
}
