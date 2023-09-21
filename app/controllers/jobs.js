const prisma = require('../lib/prisma');


const _ = require('lodash');

exports.list = async function (req, res, next) {
    const objArray = await prisma.auto_action.findMany();
    res.json(objArray);
}

exports.listTypes = async function (req, res, next) {
    const objArray = await prisma.auto_action_type.findMany();
    res.json(objArray);
}

exports.show = async function (req, res, next) {
    const id = parseInt(req.params.actionId, 10);
    const obj = await prisma.auto_action.findUnique({ where: { id: id } });
    res.json(obj);
}

exports.update = async function (req, res, next) {
    const id = parseInt(req.params.actionId, 10);
    const body = req.body;

    try {
        const updatedAutomation = await prisma.automation.update({
            where: { id: id },
            data: body
        });
        const obj = await prisma.auto_action.findUnique({ where: { id: id } });
        res.status(201).json(obj);
    } catch (error) {
        next(error);
    }
}

exports.create = async function (req, res, next) {
    const { user, role } = req.token;

    const automation = {
        ...req.body,
        userId: user
    };

    try {
        const newModel = await prisma.automation.create({ data: automation });
        res.json(newModel);
    } catch (error) {
        next(error);
    }
}

exports.destroy = async function (req, res, next) {
    try {
        const id = parseInt(req.params.actionId, 10);
        const response = await prisma.auto_action.delete({ where: { id: id } });
        res.json(response);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

exports.runJob = async function (req, res, next) {
    try {
        const typeId = parseInt(req.query.contactEventTypeId, 10);
        const array = await prisma.contact_event.findMany({
            where: {
                typeId: typeId
            },
            include: {
                user: {
                    select: {
                        automations: {
                            include: {
                                templates: {
                                    include: {
                                        action_templates: {
                                            include: {
                                                phone: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        const automations = array.map(contactEvent => {
            return contactEvent.user.automations;
        });

        res.json(automations.flat());
    } catch (e) {
        console.log(e);
        next(e);
    }
}
