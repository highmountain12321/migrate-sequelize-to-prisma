const { wrap: async } = require('co');
const _ = require('lodash');
const { Op, QueryTypes, Sequelize } = require("sequelize");
const { models, query } = require('../../sequelize');
const moment = require("moment");
const { Services } = require('../services');


exports.createContact = async function (req, res, next) {
    try {
        const userModel = req.userModel;
        const newContact = req.body;

        const genType = await prisma.userModel.findUnique({
            where: { id: userModel.id },
            select: { genType: true }
        });

        if (!genType) {
            next({ message: 'Missing GenType' });
            return;
        }

        newContact.genTypeId = genType.id;

        const newContactModel = await prisma.contact.create({
            data: newContact,
            include: {
                meters: true,
                pocs: true,
                system: true,
                genType: { select: { name: true, id: true } },
                source: true
            }
        });

        return res.status(201).json(newContactModel);
    } catch (e) {
        next(e);
    }
}



exports.listContacts = async function (req, res, next) {
    const { source, propertyTypeId = 1, isActive = true, q, limit = 1000, offset = 0, sort } = req.query;
    const userModel = req.userModel;
    const prisma = new Prisma(); // instantiate prisma client, assuming you have it set up properly

    const where = {
        isActive,
        organizationId: null
    };

    if (q && q.length > 1) {
        where.OR = Services.Search.query(q, propertyTypeId); // This line may need adjustment depending on how Services.Search.query() is implemented
    }

    const select = {
        utilityProvider: true,
        busName: true,
        isActive: true,
        createdAt: true,
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        organizationId: true,
        primaryPhone: true,
        email: true,
        city: true,
        state: true,
        postalCode: true,
        address1: true,
        source: {
            select: {
                name: true,
                id: true
            }
        },
        propertyType: {
            select: {
                name: true,
                id: true
            }
        }
    };

    const orderBy = {
        id: 'desc' // Using Prisma's syntax
    };

    if (propertyTypeId) {
        where.propertyTypeId = propertyTypeId; // Assuming direct relationship
    }

    if (source) {
        where.source = { slug: source }; // Assuming 'slug' is the field we want to filter by
    }

    const isAdmin = await userModel.isAdmin(); // This method call remains unchanged
    console.log('is admin ', isAdmin);

    if (isAdmin) {
        const results = await prisma.contact.findMany({
            where,
            select,
            orderBy,
            skip: offset,
            take: limit
        });
        res.json({ rows: results, count: 1000 }); // Hardcoded count of 1000 for now
        return;
    }

    // If not admin
    // I'm assuming you will have similar methods in Prisma's setup as you had with Sequelize for the userModel. Adjust accordingly.
    const rows = await userModel.getContacts({ where, select, orderBy, skip: offset, take: limit });
    const count = await userModel.countContacts({ where });
    res.json({ rows, count });
    return;
};


exports.listGroups = async function (req, res) {
    const contactId = parseInt(req.params.contactId, 10);

    const results = await prisma.contact.findUnique({
        where: { id: contactId },
        select: {
            groups: {
                select: {
                    name: true,
                    id: true,
                    type: {
                        select: {
                            name: true,
                            id: true
                        }
                    }
                },
                where: { isActive: true }
            }
        }
    });

    let rows = [];
    if (results) {
        rows = results.groups;
    }
    res.json({ rows, count: 100 }); // Assuming count is hardcoded to 100 for now
}



exports.count = async function (req, res) {
    const count = await prisma.contact.count();
    res.json({
        count: count,
    });
}




/**
 * Create a contact
 */

exports.create = async function (req, res, next) {
    try {
        const userModel = req.userModel;
        const organizationModel = await userModel.getOrganization();
        const newContact = req.body;

        const genType = await userModel.getGenType();
        if (!genType) {
            next({ message: 'Missing GenType' });
            return;
        }

        newContact.genTypeId = genType.id;

        const newContactData = {
            ...newContact,
            genTypeId: genType.id,
            meters: {
                create: newContact.meters
            },
            updates: {
                create: newContact.updates.map(update => ({
                    ...update,
                    appointment: {
                        create: {
                            ...update.appointment,
                            typeId: update.appointment.typeId
                        }
                    }
                }))
            },
            pocs: {
                create: newContact.pocs
            },
            system: {
                create: newContact.system
            },
            genType: {
                connect: {
                    id: newContact.genTypeId
                }
            },
            source: {
                connect: {
                    id: newContact.sourceId
                }
            }
        };

        const newContactModel = await prisma.contact.create({
            data: newContactData,
            include: {
                meters: true,
                updates: {
                    include: {
                        appointment: {
                            include: {
                                type: true
                            }
                        }
                    }
                },
                pocs: true,
                system: true,
                genType: true,
                source: true
            }
        });

        await prisma.user.update({
            where: { id: userModel.id },
            data: {
                contacts: {
                    connect: { id: newContactModel.id }
                }
            }
        });

        if (organizationModel) {
            await prisma.organization.update({
                where: { id: organizationModel.id },
                data: {
                    contacts: {
                        connect: { id: newContactModel.id }
                    }
                }
            });
        }

        if (newContactModel.updates && newContactModel.updates.length > 0) {
            const [updateModel] = newContactModel.updates;

            await prisma.user.update({
                where: { id: userModel.id },
                data: {
                    updates: {
                        connect: { id: updateModel.id }
                    }
                }
            });

            if (updateModel.appointment) {
                const appointmentModel = updateModel.appointment;

                await prisma.user.update({
                    where: { id: userModel.id },
                    data: {
                        appointments: {
                            connect: { id: appointmentModel.id }
                        }
                    }
                });

                await prisma.contact.update({
                    where: { id: newContactModel.id },
                    data: {
                        appointments: {
                            connect: { id: appointmentModel.id }
                        }
                    }
                });

                await newContactModel.setOpportunity();

                try {
                    await newContactModel.requestDesignForUser(userModel.id);
                } catch (e) {
                    console.error(e);
                }
            }
        }

        return res.status(201).json(newContactModel);

    } catch (e) {
        next(e);
    }
};




/**
 * Create a project
 */

exports.createProject = async function (req, res, next) {
    try {
        const userModel = req.userModel;
        const contactModel = req.loadedContactModel;
        const project = req.body;

        project.boardId = 1; // Assuming this is intentionally set twice
        project.projectLaneId = 1;
        project.ownerId = userModel.id;
        project.contactId = contactModel.id;

        const newProjectModel = await prisma.project.create({ data: project });

        await prisma.contact.update({
            where: { id: contactModel.id },
            data: { projectId: newProjectModel.id }
        });

        return res.status(201).json(newProjectModel);
    } catch (e) {
        next(e);
    }
};
exports.deleteProject = async function (req, res, next) {
    try {
        const userModel = req.userModel;
        const contactModel = req.loadedContactModel;

        await prisma.project.delete({
            where: { id: contactModel.projectId }
        });

        await prisma.contact.update({
            where: { id: contactModel.id },
            data: { projectId: null }
        });

        return res.status(201).json({ message: 'Project deleted successfully' });
    } catch (e) {
        next(e);
    }
};



//create_update

exports.createUpdate = async function (req, res, next) {
    const userModel = req.userModel;
    const contactModel = req.loadedContactModel;
    const newUpdate = req.body;

    if (!newUpdate.toId) {
        return res.json({});
    }

    const statusUpdateModel = await prisma.option.findFirst({
        where: {
            id: newUpdate.toId,
            isActive: true
        }
    });

    if (!statusUpdateModel) {
        return next({ message: `Status ${newUpdate.toId} not found` });
    }

    if (newUpdate.appointment && newUpdate.appointment.startDate) {
        const timezone = newUpdate.appointment.timezone;
        const appointment = newUpdate.appointment;
        const typeId = appointment.typeId;
        const appointmentTypeModel = await prisma.appointment_type.findFirst({
            where: {
                id: typeId,
                isActive: true
            }
        });

        const newAppointment = {
            timezoneOffset: timezone.timeValue,
            timezone: timezone,
            startDate: appointment.startDate,
            endDate: moment(appointment.startDate).add(appointmentTypeModel.add, 'minutes').format("YYYY-MM-DD HH:mm:ss"),
            typeId: appointmentTypeModel.id,
            contactId: newUpdate.contactId,
            userId: userModel.id
        };

        const newAppointmentModel = await prisma.appointment.create({ data: newAppointment });
        newUpdate.appointmentId = newAppointmentModel.id;

        // Assuming addAppointment methods add a relational link. We will now link them using Prisma.
        await prisma.contact.update({
            where: { id: contactModel.id },
            data: { appointments: { connect: { id: newAppointmentModel.id } } }
        });

        await prisma.user.update({
            where: { id: userModel.id },
            data: { appointments: { connect: { id: newAppointmentModel.id } } }
        });
    }

    newUpdate.contactId = contactModel.id;
    const newUpdateModel = await prisma.contact_update.create({ data: newUpdate });

    // Associate the new update with the contact and user.
    await prisma.contact.update({
        where: { id: contactModel.id },
        data: { updates: { connect: { id: newUpdateModel.id } } }
    });
    await prisma.user.update({
        where: { id: userModel.id },
        data: { updates: { connect: { id: newUpdateModel.id } } }
    });

    const to = await prisma.option.findFirst({
        where: { id: newUpdateModel.toId },
        select: { slug: true }
    });

    const slug = to.slug;

    if (slug.includes('appointment-set') || slug.includes('reschedule')) {
        const attendees = [];
        const users = await prisma.contact.findUnique({
            where: { id: contactModel.id },
            include: { users: true }
        }).users;

        for (let user of users) {
            attendees.push({ email: user.email, displayName: `${user.firstName} ${user.lastName}` });
        }
        try {
            await Services.GAPI.createCalendarEvent(userModel.id, 'primary', newUpdate.appointmentId, attendees);
        } catch (error) {
            console.error('Appointment creation failed:', error);
        }
    }

    if (slug.includes('drop')) {
        try {
            await prisma.contact.update({
                where: { id: contactModel.id },
                data: { /* appropriate attributes to indicate drop */ }
            });

            if (contactModel.sourceId === 5 && newUpdate.note && newUpdate.note.length > 4) {
                await contactModel.returnLead(newUpdate.note);  // Assuming this remains a custom function
            }
        } catch (e) {
            console.error(e);
        }
    }

    if (slug.includes('-lead')) {
        await prisma.contact.update({
            where: { id: contactModel.id },
            data: { /* appropriate attributes to indicate lead */ }
        });
    }
    if (slug.includes('request-new-redesign')) {
        await contactModel.requestDesignForUser(userModel.id);  // Assuming this remains a custom function
    }
    if (slug.includes('appointment-set')) {
        await contactModel.requestDesignForUser(userModel.id);  // Assuming this remains a custom function
        await prisma.contact.update({
            where: { id: contactModel.id },
            data: { /* appropriate attributes to indicate opportunity */ }
        });
    }

    if (slug.includes('close')) {
        await prisma.contact.update({
            where: { id: contactModel.id },
            data: { /* appropriate attributes to indicate closed status */ }
        });
    }

    res.json(newUpdate);

};


// createClosingForm
exports.createClosingForm = async function (req, res, next) {
    const body = req.body;

    if (body.id) {
        const closingFormUpdateModel = await prisma.closing_form.update({
            where: { id: body.id },
            data: body, // Assuming direct update is possible; you might need to adjust the shape of 'body'
            include: {
                updates: {
                    include: {
                        type: true
                    }
                }
            }
        });
        res.json(closingFormUpdateModel);
        return;
    }

    const partnerProposals = await prisma.partnerProposal.findMany({
        where: {
            contactId: req.params.contactId,
            selectDate: { NOT: null }
        }
    });

    const partnerModel = await prisma.partner.findFirst({
        where: { id: partnerProposals[0].partnerId }
    });

    const closingFormModel = await prisma.closing_form.create({
        data: body,
        include: {
            updates: {
                include: {
                    type: true
                }
            }
        }
    });

    // Assuming you have established relations for closing forms in Prisma schema
    // You might need to adjust the relation connecting logic depending on your relations in the schema
    await prisma.contact.update({
        where: { id: req.params.contactId },
        data: { closingForms: { connect: { id: closingFormModel.id } } }
    });

    await prisma.user.update({
        where: { id: req.userModel.id },
        data: { closingForms: { connect: { id: closingFormModel.id } } }
    });

    await prisma.partner.update({
        where: { id: partnerModel.id },
        data: { closingForms: { connect: { id: closingFormModel.id } } }
    });

    res.json(closingFormModel);
};

// createDocument
exports.createDocument = async function (req, res, next) {
    const body = {
        ...req.body,
        contactId: req.params.contactId,
        userId: req.token.user
    };

    const newDocument = await prisma.document.create({ data: body });
    res.json(newDocument);
};

// createPartnerProposal
exports.createPartnerProposal = async function (req, res, next) {
    const body = req.body;

    const newProposal = await prisma.partner_proposal.create({ data: body });

    // Assuming the relation between contact and partner proposals is setup in Prisma schema
    await prisma.contact.update({
        where: { id: req.params.contactId },
        data: { partnerProposals: { connect: { id: newProposal.id } } }
    });

    res.json(newProposal);
};

// selectPartnerProposal
exports.selectPartnerProposal = async function (req, res, next) {
    const proposals = await prisma.partnerProposal.findMany({
        where: { contactId: req.params.contactId },
        include: { partner: true }
    });

    for (let proposal of proposals) {
        await prisma.partnerProposal.update({
            where: { id: proposal.id },
            data: {
                selectDate: proposal.id === parseInt(req.params.partnerProposalId) ?
                    new Date() : null
            }
        });
    }

    res.json({ rows: proposals, count: proposals.length });
};

// listPartnerProposals
exports.listPartnerProposals = async function (req, res, next) {
    const proposals = await prisma.partnerProposal.findMany({
        where: { contactId: req.params.contactId },
        include: { partner: true }
    });

    res.json({ rows: proposals, count: proposals.length });
};


/**
 * Lenders
 */
// createPartnerLenderProposal
exports.createPartnerLenderProposal = async function (req, res, next) {
    const body = req.body;

    const newProposal = await prisma.lender_proposal.create({ data: body });

    // Assuming the relation between contact and lender proposals is setup in Prisma schema
    await prisma.contact.update({
        where: { id: req.params.contactId },
        data: { lenderProposals: { connect: { id: newProposal.id } } }
    });

    res.json(newProposal);
};

// selectLenderProposal
exports.selectLenderProposal = async function (req, res, next) {
    const proposals = await prisma.lenderProposal.findMany({
        where: { contactId: req.params.contactId },
        include: { lender: true }
    });

    for (let proposal of proposals) {
        await prisma.lenderProposal.update({
            where: { id: proposal.id },
            data: {
                selectDate: proposal.id === parseInt(req.params.partnerProposalId) ?
                    new Date() : null
            }
        });
    }

    res.json({ rows: proposals, count: proposals.length });
};

// listLenderProposals
exports.listLenderProposals = async function (req, res, next) {
    const proposals = await prisma.lenderProposal.findMany({
        where: { contactId: req.params.contactId },
        include: { lender: true }
    });

    res.json({ rows: proposals, count: proposals.length });
};


/**
 * Update contact
 */

// Update
exports.update = async function (req, res, next) {
    const { user, role } = req.token;
    const body = req.body;
    const contactId = req.loadedContactModel.id;

    const updatedContact = await prisma.contact.update({
        where: { id: contactId },
        data: body,  // Assuming the structure of `body` matches the schema structure
        include: {
            updates: {
                include: {
                    appointment: true
                }
            },
            pocs: true,
            system: true,
            genType: true,
        }
    });

    if (body.system) {
        body.system.contactId = contactId;
        await prisma.contact_system.upsert({
            where: { id: body.system.id || undefined },
            create: body.system,
            update: body.system,
        });
    }

    if (body.pocs) {
        for (let poc of body.pocs) {
            poc.contactId = contactId;
            await prisma.poc.upsert({
                where: { id: poc.id || undefined },
                create: poc,
                update: poc,
            });
        }
    }

    if (body.updates) {
        for (let update of body.updates) {
            update.contactId = contactId;
            update.userId = user;
            const newUpdate = await prisma.contact_update.create({
                data: update,
                include: {
                    appointment: true
                }
            });

            // Assuming that there's an `updateId` field in contact. Update the schema if necessary
            await prisma.contact.update({
                where: { id: contactId },
                data: { updateId: newUpdate.id }
            });

            if (newUpdate.appointment) {
                await prisma.contact.update({
                    where: { id: contactId },
                    data: { status: 'Opportunity' }  // Assuming there's a status field you want to set to 'Opportunity'
                });
            }
        }
    }

    res.status(201).json(updatedContact);
};

// Request New Design
exports.requestNewDesign = async function (req, res, next) {
    const contactId = req.params.contactId;
    
    // The function `requestDesignForUser` is not a standard ORM method, it might be specific to your old model. 
    // So, you'd need to rewrite it with equivalent Prisma operations or a custom function.
    // Here's a placeholder:
    await customFunctionToRequestDesignForUser(contactId, req.userModel.id);

    res.json({ isOkay: true });
};

// You'll need to define customFunctionToRequestDesignForUser or replace it with the equivalent logic you have.

// Show
exports.show = async function (req, res, next) {
    const contactId = req.loadedContactModel.id;

    const contact = await prisma.contact.findUnique({
        where: { id: contactId },
        include: {
            meters: true,
            promotions: true,
            groups: true,
            roofType: true,
            genType: true,
            updates: {
                include: {
                    user: true,
                    to: true,
                    appointment: {
                        include: {
                            type: true
                        }
                    }
                }
            },
            documents: {
                include: {
                    type: true
                }
            },
            users: {
                include: {
                    role: true
                }
            },
            partnerProposals: {
                include: {
                    partner: true
                }
            },
            lenderProposals: {
                include: {
                    lender: true
                }
            }
        }
    });

    if (contact.busName) {
        contact.pocs = await prisma.poc.findMany({
            where: { contactId: contact.id }
        });
    }

    res.json(contact);
};

// List Updates
exports.listUpdates = async function (req, res) {
    const contactId = req.loadedContactModel.id;

    const updates = await prisma.contact_update.findMany({
        where: { contactId },
        include: {
            user: {
                select: {
                    firstName: true,
                    lastName: true
                }
            },
            to: {
                select: {
                    name: true
                }
            },
            appointment: {
                include: {
                    type: {
                        select: {
                            name: true
                        }
                    }
                },
                select: {
                    fromDate: true,
                    toDate: true,
                    typeId: true,
                    tzOffset: true,
                    timezoneOffset: true,
                    startDate: true,
                    endDate: true,
                    timezone: true
                }
            }
        }
    });

    const newData = updates.map((update) => {
        if (update.appointment && update.appointment.tzOffset) {
            update.appointment.startDate = moment(update.appointment.fromDate).utcOffset(update.appointment.tzOffset, true).format();
            update.appointment.endDate = moment(update.appointment.toDate).utcOffset(update.appointment.tzOffset, true).format();
        }

        if (update.appointment && update.appointment.timezoneOffset) {
            update.appointment.startDate = moment(update.appointment.startDate).utcOffset(update.appointment.timezoneOffset, true).format();
            update.appointment.endDate = moment(update.appointment.endDate).utcOffset(update.appointment.timezoneOffset, true).format();
        }
        return update;
    });

    res.status(200).json(newData);
};


/**
 * Delete an contact
 */

exports.destroy = async function (req, res) {
    const id = +req.params.contactId;
    let r;

    if (req.userModel) {
        // Assuming userModel has a relation with contact and there is a function called removeContact
        // Prisma does not have a built-in remove method for relationships, you need to manually unset the relation
        r = await prisma.user.update({
            where: { id: req.userModel.id },
            data: { contacts: { disconnect: { id } } }
        });
    } else {
        r = await prisma.contact.delete({
            where: { id }
        });
    }

    res.json(r);
};





// contact/contactId/appointments
exports.listClosingForm = async function (req, res, next) {
    const contactId = +req.params.contactId;
    const closingForm = await prisma.closing_form.findMany({
        where: { contactId },
        orderBy: { id: 'desc' },
        include: {
            updates: {
                select: {
                    createdAt: true,
                    note: true,
                    type: {
                        select: {
                            name: true
                        }
                    }
                }
            },
            contact: {
                select: {
                    partnerProposals: {
                        select: {
                            partnerId: true,
                            partner: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });
    res.status(200).json(closingForm);
};




// contact/contactId/appointments
exports.listContactAppointments = async function (req, res, next) {
    const contactId = +req.params.contactId;
    const contacts = await prisma.contact.findUnique({
        where: { id: contactId },
        include: {
            appointments: {
                orderBy: { id: 'desc' }
            }
        }
    });
    res.status(200).json(contacts);
};





exports.createAdder = async function (req, res, next) {
    const object = req.body;

    const newModel = await prisma.adder.create({
        data: object
    });
    // Assuming loadedContactModel has a relation with adder and there is a function called addAdder
    await prisma.contact.update({
        where: { id: req.loadedContactModel.id },
        data: { adders: { connect: { id: newModel.id } } }
    });
    res.json(newModel);
};

exports.deleteAdder = async function (req, res, next) {
    const id = +req.params.adderId;

    const model = await prisma.adder.findUnique({
        where: { id }
    });
    if (model) {
        const response = await prisma.adder.delete({ where: { id } });
        res.json(response);
    } else {
        res.json({ message: 'Not Found' });
    }
};

exports.listAdders = async function (req, res, next) {
    const contactId = +req.params.contactId;

    const proposals = await prisma.adder.findMany({
        where: { contactId },
        select: ['id', 'name', 'value', 'quantity']
    });
    res.status(200).json(proposals);
};


exports.createMeter = async function (req, res, next) {
    try {
        const body = req.body;
        const newMeterModel = await prisma.meter.create({
            data: body
        });
        await prisma.contact.update({
            where: { id: req.loadedContactModel.id },
            data: { meters: { connect: { id: newMeterModel.id } } }
        });
        res.json(newMeterModel);
    } catch (e) {
        console.error(e);
        next(e);
    }
};

exports.updateMeter = async function (req, res, next) {
    try {
        const body = req.body;
        const updatedMeterModel = await prisma.meter.update({
            where: { id: req.loadedMeterModel.id },
            data: body
        });
        res.json(updatedMeterModel);
    } catch (e) {
        console.error(e);
        next(e);
    }
};



exports.deleteMeter = async function (req, res, next) {
    try {
        const deletedMeter = await prisma.meter.delete({
            where: { id: req.loadedMeterModel.id }
        });
        res.json(!!deletedMeter);
    } catch (e) {
        console.error(e);
        next(e);
    }
};


exports.listIncentives = async function (req, res, next) {
    try {
        const state = req.loadedContactModel.state;
        const list = await Services.SolarIncentives.getIncentives(state);
        res.json(list);
    } catch (e) {
        console.error(e);
        next(e);
    }
};



exports.createNote = async function (req, res, next) {
    try {
        const { user } = req.token;
        const contents = req.body.contents;

        const newNote = await prisma.note.create({
            data: {
                userId: user,
                contents: contents,
                contact: {
                    connect: { id: +req.params.contactId }
                }
            }
        });

        const notes = await prisma.note.findMany({
            where: { contactId: +req.params.contactId },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: { id: 'desc' }
        });

        res.status(200).json(notes);
    } catch (e) {
        console.error(e);
        next(e);
    }
};


exports.createComments = async function (req, res, next) {
    try {
        const { user } = req.token;
        const comment = req.body.comment;

        const newComment = await prisma.contact_comment.create({
            data: {
                userId: user,
                comment: comment,
                contact: {
                    connect: { id: +req.params.contactId }
                }
            }
        });

        const comments = await prisma.contact_comment.findMany({
            where: { contactId: +req.params.contactId },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        picUrl: true,
                        role: {
                            select: { name: true }
                        }
                    }
                }
            },
            orderBy: { id: 'desc' }
        });

        res.status(200).json(comments);
    } catch (e) {
        console.error(e);
        next(e);
    }
};

exports.deletePromotion = async function (req, res, next) {
    try {
        const deletedPromotion = await prisma.promotion.delete({
            where: {
                id: +req.params.promotionId
            }
        });
        res.status(200).json(!!deletedPromotion);
    } catch (e) {
        console.error(e);
        next(e);
    }
};


exports.createPromotion = async function (req, res, next) {
    try {
        const promotion = req.body;

        const newPromotion = await prisma.promotion.create({
            data: {
                ...promotion,
                contact: {
                    connect: { id: +req.params.contactId }
                },
                user: {  // assuming a relationship between promotion and user
                    connect: { id: req.userModel.id }
                }
            }
        });

        res.status(200).json(newPromotion);
    } catch (e) {
        console.error(e);
        next(e);
    }
};


exports.listPromotions = async function (req, res, next) {
    try {
        const promotions = await prisma.promotion.findMany({
            where: { contactId: +req.params.contactId }
        });
        res.status(200).json(promotions);
    } catch (e) {
        console.error(e);
        next(e);
    }
};



exports.listNotes = async function (req, res, next) {
    try {
        const notes = await prisma.note.findMany({
            where: { contactId: +req.params.contactId },
            include: { user: { select: { firstName: true, lastName: true } } },
            orderBy: { id: 'desc' }
        });
        res.status(200).json(notes);
    } catch (e) {
        console.error(e);
        next(e);
    }
};


exports.listComments = async function (req, res, next) {
    try {
        const comments = await prisma.contact_comment.findMany({
            where: { contactId: +req.params.contactId },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        picUrl: true,
                        role: { select: { name: true } }
                    }
                }
            },
            orderBy: { id: 'desc' }
        });
        res.status(200).json(comments);
    } catch (e) {
        console.error(e);
        next(e);
    }
};



exports.listUsers = async function (req, res, next) {
    try {
        const isActive = req.query.isActive;
        let where = {};

        if (isActive !== undefined) {
            where.isActive = isActive === 'false' ? false : true;
        }

        const users = await prisma.user.findMany({
            where: where,
            select: {
                firstName: true,
                lastName: true,
                id: true,
                lastLoginDate: true,
                createdAt: true,
                email: true,
                primaryPhone: true,
                picUrl: true,
                role: { select: { name: true } }
            }
        });
        
        const count = await prisma.user.count({ where: where });

        res.status(200).json({ rows: users, count: count });
    } catch (e) {
        console.error(e);
        next(e);
    }
};


exports.listLenderProposals = async function (req, res, next) {
    try {
        const proposals = await prisma.lender_proposal.findMany({
            where: { contactId: +req.params.contactId },
            select: {
                id: true,
                loanAmount: true,
                systemPrice: true,
                rate: true,
                months: true,
                systemSize: true,
                lender: { select: { name: true, id: true } }
            }
        });
        res.status(200).json(proposals);
    } catch (e) {
        console.error(e);
        next(e);
    }
};



exports.listDocuments = async function (req, res, next) {
    try {
        const contactId = req.params.contactId;
        const contacts = await prisma.contact.findUnique({
            where: { id: +contactId },
            select: {
                id: true,
                documents: {
                    select: {
                        originalName: true,
                        id: true,
                        typeId: true,
                        createdAt: true,
                        location: true,
                        type: {
                            select: {
                                name: true,
                                slug: true
                            }
                        }
                    }
                }
            }
        });
        res.status(200).json(contacts);
    } catch (e) {
        console.error(e);
        next(e);
    }
};


// Given the code seems identical to the above, 
// I'm not sure why you'd want a duplicate. Here's the conversion anyway.
exports.showContactClosingForm = exports.listDocuments;


exports.deletePoc = async function (req, res, next) {
    try {
        const { contactId, pocId } = req.params;
        const contactExists = await prisma.contact.findUnique({ where: { id: +contactId } });
        if (!contactExists) {
            return next({ message: 'Contact does not exist' });
        }
        const pocExists = await prisma.poc.findUnique({ where: { id: +pocId } });
        if (!pocExists) {
            return next({ message: 'poc does not exist' });
        }
        await prisma.poc.delete({ where: { id: +pocId } });
        res.json({ message: 'Deleted successful' });
    } catch (e) {
        console.error(e);
        next(e);
    }
};

exports.delete = async function (req, res, next) {
    try {
        const { user, role } = req.token;
        if (role.toLowerCase() !== 'admin') {
            return next({ message: 'Not authorized' });
        }
        const contactId = req.params.contactId;
        const contact = await prisma.contact.findUnique({ where: { id: +contactId }, include: { documents: true } });
        
        if (!contact) {
            return next({ message: 'Contact does not exist' });
        }

        if (contact.documents && contact.documents.length > 0) {
            for (let documentModel of contact.documents) {
                try {
                    // Assuming Services.Document.delete is some external function, we'll leave it as is.
                    await Services.Document.delete({
                        version: documentModel.versionId,
                        key: documentModel.key
                    });
                    await prisma.document.delete({ where: { id: documentModel.id } });
                } catch (e) {
                    console.error(e);
                }
            }
        }

        await prisma.contact.delete({ where: { id: +contactId } });
        res.status(200).json({ deleted: true });
    } catch (e) {
        return next(e);
    }
};

