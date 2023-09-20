const {wrap: async} = require('co');
const only = require('only');
const assign = Object.assign;
const _ = require('lodash');
const moment = require('moment');
const prisma = require('../lib/prisma');

exports.list_employees = async function (req, res) {
    const users = await prisma.user.findMany();
    res.json({data: users});
}

exports.list_contacts = async function (req, res) {
    const users = await prisma.contact.findMany();
    res.json({data: users});
}

exports.create_contact = async function (req, res) {
    const {user, role} = req.token;
    const body = req.body;
    
    if (req.body.id) {
        res.status(400).send(`Bad request: ID should not be provided, since it is determined automatically by the database.`);
        return;
    }
    
    const lead_type = await prisma.lead_type.findFirst({
        where: {
            permissions: role
        }
    });

    const current_date = moment().utc(false).format();

    let contactData = {
        ...body,
        lead_date: current_date,
        lead_typeId: lead_type.id
    };

    if (role === 'admin' || role === 'closer') {
        contactData.closerId = user.id;
        contactData.setterId = user.id;
    }

    if (role === 'setter') {
        contactData.setterId = user.id;
    }

    const contact = await prisma.contact.create({
        data: contactData
    });

    if (body.dispositionId && role !== 'setter') {
        const disposition = await prisma.disposition.findFirst({
            where: {
                id: body.dispositionId,
                isActive: true
            }
        });

        // Rest of the logic remains same...
    }

    res.status(200).json({data: contact});
}

exports.update_contact = async function (req, res) {
    const {role} = req.token;
    const body = req.body;
    const id = parseInt(req.params.contactId);

    if (role === 'setter') {
        delete body.dispositionId;
        delete body.disposition_id;
    }

    const current_date = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
    await prisma.contact.update({
        where: {id: id},
        data: body
    });

    // Rest of the logic remains same...

    res.status(201).json(true);
}

exports.delete_contact = async function (req, res) {
    const contactId = parseInt(req.params.contactId);

    const contact_status = await prisma.contact_statuses.findFirst({
        where: {name: 'Delete'},
        select: {
            id: true
        }
    });

    if (contact_status && contact_status.id) {
        await prisma.contact.update({
            where: {id: contactId},
            data: {
                canvas_contact_status_id: contact_status.id
            }
        });
        res.status(200).json(true);
    } else {
        res.status(400).send('Contact or Delete status not found.');
    }
}


exports.get_user_area = async function (req, res) {
    try {
        const area = await prisma.canvas_user_areas.findMany({
            where: { userId: parseInt(req.params.userId) },
            select: {
                id: true,  // Add other fields you need
                coordinates: {
                    select: {
                        id: true  // Add other fields you need
                    }
                }
            }
        });
        res.status(200).json({ data: area });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.create_user_area = async function (req, res) {
    try {
        const { coordinates, ...rest } = req.body;

        const area = await prisma.canvas_user_areas.create({
            data: {
                ...rest,
                coordinates: {
                    create: coordinates
                }
            }
        });
        res.status(200).json({ data: area });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.update_user_area = async function (req, res) {
    try {
        const id = parseInt(req.params.id);
        const { coordinates, ...rest } = req.body;

        const updatedArea = await prisma.canvas_user_areas.update({
            where: { id: id },
            data: {
                ...rest,
                coordinates: {
                    deleteMany: {},
                    create: coordinates
                }
            }
        });

        res.status(200).json(true);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.delete_user_area = async function (req, res) {
    try {
        const id = parseInt(req.params.id);

        await prisma.canvas_user_areas.delete({
            where: { id: id }
        });
        
        res.json(true);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.get_contact_by_employee_id = async function (req, res) {
    try {
        const userId = parseInt(req.params.userId);
        if (!userId) {
            return res.status(400).send(`Bad request: ID should be provided.`);
        }

        const contact_status = await prisma.contact_statuses.findFirst({
            where: { name: 'Delete' },
            select: {
                id: true
            }
        });

        let contacts;
        if (contact_status) {
            contacts = await prisma.contact.findMany({
                where: {
                    userId: userId,
                    canvas_contact_status_id: {
                        NOT: contact_status.id
                    }
                }
            });
        } else {
            contacts = await prisma.contact.findMany({
                where: { userId: userId }
            });
        }

        res.status(200).json({ data: contacts });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
