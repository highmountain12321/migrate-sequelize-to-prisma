const { PrismaClient } = require('@prisma/client');
const moment = require("moment");
const prisma = new PrismaClient();
const only = require('only');

exports.list = async function (req, res) {
    try {
        const appointments = await prisma.appointment.findMany({
            where: { isActive: true },
            select: {
                startDate: true,
                endDate: true,
                typeId: true,
                timezone: true,
                contact: {
                    select: {
                        email: true,
                        primaryPhone: true,
                        firstName: true,
                        lastName: true,
                        id: true,
                        name: true
                    }
                },
                type: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                startDate: 'asc'
            }
        });

        const newData = appointments.map((appt) => {
            if (appt.startDate && appt.timezone) {
                appt.startDate = moment(appt.startDate).utcOffset(appt.timezone).format();
                appt.endDate = moment(appt.endDate).utcOffset(appt.timezone).format();
            }
            return appt;
        });

        res.json(newData);
    } catch (error) {
        console.error("Error fetching data: ", error);
        res.status(500).send("Internal Server Error");
    }
}

exports.listAppointmentTypes = async function (req, res) {
    const data = await prisma.appointment_type.findMany({
        where: {
            isActive: true
        }
    });
    res.json(data);
}

exports.listStatuses = async function (req, res) {
    let role = req.token.role;
    let where = { isActive: true };
    if (role === 'setter') {
        where.permissions = 'setter'
    }

    const obj_array = await prisma.appointment_status.findMany({
        where: where
    });
    res.json({ data: obj_array });
}

exports.count = async function (req, res) {
    const count = await prisma.appointment.count();
    res.json({
        count: count,
    })
}

exports.create = async function (req, res, next) {
    try {
        const body = req.body;
        const contact = await prisma.contact.findUnique({
            where: {
                id: body.contactId
            },
            include: {
                update: {
                    include: {
                        to: true
                    }
                }
            }
        });

        if (!contact) {
            next({
                message: `Contact ${body.contactId} not found`
            });
            return;
        }

        const newAppointment = await prisma.appointment.create({
            data: {
                ...body,
                contactId: contact.id,
                statusId: body.statusId
            }
        });

        res.status(201).json(newAppointment);

    } catch (error) {
        console.error("Error creating data: ", error);
        res.status(500).send("Internal Server Error");
    }
}

exports.update = async function (req, res, next) {
    const id = req.params.appointmentId;
    if (req.body.id) {
        res.status(400).send(`Bad request: ID should not be provided, since it is determined automatically by the database.`);
        return;
    }
    const obj = await prisma.appointment.update({
        where: { id: parseInt(id) },
        data: req.body
    });
    res.status(201).json({ data: obj });
}

exports.show = async function (req, res) {
    const id = req.params.appointmentId;
    const obj = await prisma.contact.findUnique({
        where: {
            id: parseInt(id)
        },
        include: {
            contact_method: true,
            type: true
        }
    });

    res.status(200).json({ data: obj });
}

exports.destroy = async function (req, res, next) {
    try {
        const id = req.params.id;
        const response = await prisma.appointment.delete({
            where: { id: parseInt(id) }
        });
        res.json({ data: response });
    } catch (error) {
        console.error("Error deleting data: ", error);
        next(error);
    }
}
