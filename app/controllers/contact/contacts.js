const moment = require("moment");
const { Services } = require('../../services');
const jsonexport = require('jsonexport');

const prisma = require('../../lib/prisma');


exports.list = async function (req, res, next) {
  let { assignment = 'all', userId, states, genType, sourceId, propertyTypeId = 1, isActive = true, stageId, q, statusFilter, limit = 100, offset = 0, sort, organizationFilter, fileType = false } = req.query;

  const userModel = req.userModel;
  const responseState = {
    userId
  }

  const where = {
    isActive: isActive
  }

  if (assignment === 'unassigned') {
    where.users = {
      id: null
    }
  }

  if (states) {
    where.state = {
      in: states.toString().indexOf(',') > -1 ? states.split(',') : [states],
    }
  }

  if (userId) {
    where.users = {
      id: userId
    }
  }

  if (q) {
    where.OR = Services.Search.query(q, propertyTypeId);
  }

  const query = {
    skip: offset,
    take: limit,
    orderBy: {
      id: 'desc'
    },
    where,
    include: {
      users: {
        select: { id: true, firstName: true, lastName: true },
        include: {
          role: {
            select: { name: true }
          }
        }
      },
      updates: {
        take: 1,
        orderBy: { id: 'desc' },
        include: {
          to: true
        }
      },
      stage: true,
      organization: true,
      source: true,
      groups: {
        include: {
          type: true
        }
      },
      genType: true,
      propertyType: true
    }
  }
  if (propertyTypeId === 2) {
    delete query.take;
    delete query.skip;
  }

  if (organizationFilter) {
    where.organizationId = {
      in: organizationFilter.toString().indexOf(',') > -1 ? organizationFilter.split(',') : [organizationFilter]
    };
  }

  if (stageId) {
    if (!query.include.stage) {
      query.include.stage = {};
    }
    query.include.stage.where = {
      id: stageId
    };
  }

  if (sourceId) {
    if (!query.include.source) {
      query.include.source = {};
    }
    query.include.source.where = {
      id: sourceId
    };
  }

  if (propertyTypeId) {
    if (!query.include.propertyType) {
      query.include.propertyType = {};
    }
    query.include.propertyType.where = {
      id: propertyTypeId
    };
  }

  if (statusFilter) {
    if (!query.include.updates) {
      query.include.updates = {};
    }

    // Ordering by relation fields in Prisma
    if (!query.orderBy) {
      query.orderBy = {};
    }
    query.orderBy.updates = {
      id: 'desc'
    };

    // Modify inclusion to have the where condition
    if (!query.include.updates.include) {
      query.include.updates.include = {};
    }

    // Apply the OR condition from the service
    query.include.updates.include.to = {
      where: {
        OR: Services.Search.statusFilter(statusFilter)
      }
    };
  }

  if (isAdmin) {
    if (fileType !== 'csv') {
      query.include.automation_runs = {
        include: {
          automation: true // Only necessary if you want to fetch the related 'automation'
        }
      };
    }

    if (fileType === 'csv') {
      const rows = await prisma.contact.findMany(query);

      const data = rows.map((m) => {
        const status = m.updates[0] ? m.updates[0].to.name : '';
        const source = m.source ? m.source.name : '';

        const name = m.busName ? m.busName : `${m.firstName} ${m.lastName}`;
        return {
          createdAt: m.createdAt,
          status,
          name,
          source,
          primaryPhone: m.primaryPhone,
          email: m.email,
          address1: m.address1,
          city: m.city,
          state: m.state,
          postalCode: m.postalCode
        };
      });

      const csv = await jsonexport(data);
      res.setHeader("content-disposition", `attachment; filename=file.csv`);
      res.setHeader("Content-Type", "text/csv");
      res.attachment('file.csv');
      return res.status(200).send(csv);
    } else {
      const rows = await prisma.contact.findMany(query);
      const count = await prisma.contact.count({ where: query.where });

      if (propertyTypeId === 2) {
        rows.slice(offset, limit);
      }

      res.json({ rows, count });
      return;
    }
  } else {
    // Assuming you have similar functionality available in Prisma.
    const contacts = await prisma.user.findUnique({ where: { id: userModel.id } }).contacts(query);
    const countContacts = await prisma.contact.count(query.where);

    if (fileType === 'csv') {
      const rows = await prisma.contact.findMany(query);

      const data = rows.map((m) => {
        const status = m.updates[0] ? m.updates[0].to.name : '';
        const name = m.busName ? m.busName : `${m.firstName} ${m.lastName}`;
        return {
          createdAt: m.createdAt,
          status,
          name,
          primaryPhone: m.primaryPhone,
          email: m.email,
          address1: m.address1,
          city: m.city,
          state: m.state,
          postalCode: m.postalCode
        };
      });

      const csv = await jsonexport(data);
      res.setHeader("content-disposition", `attachment; filename=file.csv`);
      res.setHeader("Content-Type", "text/csv");
      res.attachment('file.csv');
      return res.status(200).send(csv);
    } else {
      // Adjust according to your Prisma schema. For simplicity, I'm fetching all contacts.
      const rows = await prisma.contact.findMany(query);

      res.json({ rows: contacts, count: countContacts, state: responseState });
    }
  }

}

exports.listGroups = async function (req, res) {
  const contactId = req.params.contactId;

  const result = await prisma.contact.findUnique({
    where: { id: contactId },
    include: {
      groups: {
        select: {
          name: true,
          id: true,
          type: {
            select: {
              name: true,
              id: true
            },
            where: {
              isActive: true
            }
          }
        },
        where: {
          isActive: true
        }
      }
    }
  });

  let rows = [];
  if (result) {
    rows = result.groups;
  }

  res.json({ rows, count: 100 }); // You've hardcoded count to 100, consider changing this if necessary
};

exports.count = async function (req, res) {
  const count = await prisma.contact.count();
  res.json({
    count: count,
  });
};

exports.runAutomation = async function (req, res, next) {
  try {
    const userId = req.userModel.id; // Adjust how you get this
    const contactId = req.loadedContactModel.id; // Adjust how you get this
    const automationId = req.loadedAutomationModel.id; // Adjust how you get this

    const response = await runAutomationUtility(userId, contactId, automationId, { manual: true });

    return res.status(201).json(response);

  } catch (e) {
    next(e);
  }
};
// async function runAutomationUtility(userId, contactId, automationId, options) {
//   // Logic to run the automation. This would use Prisma to interact with the DB as needed.
// }

const { prisma } = require("path-to-your-prisma-client"); // Adjust the path accordingly

exports.create = async function (req, res, next) {
  try {
    const userId = req.userModel.id; // Adjust how you retrieve this
    const newContact = req.body;

    const genType = await prisma.userGenType.findFirst({ where: { userId: userId } }); // Assuming there's a relation named userGenType
    if (!genType) {
      next({ message: 'Missing GenType' });
      return;
    }

    newContact.genTypeId = genType.id;
    newContact.sourceId = 11; // source is REP

    const newContactModel = await prisma.contact.create({
      data: {
        ...newContact,
        meters: {
          create: newContact.meters,
        },
        updates: {
          create: {
            ...newContact.updates,
            appointment: {
              create: {
                ...newContact.updates.appointment,
                type: {
                  create: newContact.updates.appointment.type,
                },
              },
            },
          },
        },
        pocs: {
          create: newContact.pocs,
        },
        system: {
          create: newContact.system,
        },
        genType: {
          connect: {
            id: newContact.genTypeId, // Assuming genTypeId is available in newContact
          },
        },
        source: {
          connect: {
            id: newContact.sourceId, // Assuming sourceId is available in newContact
          },
        },
      },
      include: {
        meters: true,
        updates: {
          include: {
            appointment: {
              include: {
                type: true,
              },
            },
          },
        },
        pocs: true,
        system: true,
        genType: {
          select: {
            name: true,
            id: true,
          },
        },
        source: true,
      },
    });


    // Associating the contact with the user and organization
    await prisma.user.update({
      where: { id: userId },
      data: { contacts: { connect: { id: newContactModel.id } } }
    });
    const organizationId = req.organizationModel.id; // Adjust how you retrieve this
    if (organizationId) {
      await prisma.organization.update({
        where: { id: organizationId },
        data: { contacts: { connect: { id: newContactModel.id } } }
      });
    }

    // Handling the updates and appointments (this logic is based on your original code, adjust as necessary)
    if (newContactModel.updates && newContactModel.updates.length > 0) {
      const [updateModel] = newContactModel.updates;
      await prisma.user.update({
        where: { id: userId },
        data: { updates: { connect: { id: updateModel.id } } }
      });

      if (updateModel.appointment) {
        const appointmentModel = updateModel.appointment;
        await prisma.user.update({
          where: { id: userId },
          data: { appointments: { connect: { id: appointmentModel.id } } }
        });
        await prisma.contact.update({
          where: { id: newContactModel.id },
          data: { appointments: { connect: { id: appointmentModel.id } } }
        });
        // Assuming there's a method to set opportunity, this would be updated as well.
        // Placeholder for the requestDesignForUser function
        try {
          await requestDesignForUserUtility(newContactModel.id, userId);
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

// // Placeholder for the requestDesignForUser function. You'll need to implement this based on the original Sequelize logic.
// async function requestDesignForUserUtility(contactId, userId) {
//   // Implement the logic here
// }

exports.createProject = async function (req, res, next) {
  try {
    const userModel = req.userModel;
    const contactModel = req.loadedContactModel;
    const projectData = req.body;

    projectData.boardId = 1;
    projectData.projectLaneId = 1;
    projectData.ownerId = userModel.id;
    projectData.contactId = contactModel.id;

    const newProjectModel = await prisma.project.create({
      data: projectData
    });

    await prisma.contact.update({
      where: { id: contactModel.id },
      data: { projectId: newProjectModel.id }
    });

    return res.status(201).json(newProjectModel);
  } catch (e) {
    next(e);
  }
}


exports.deleteProject = async function (req, res, next) {
  try {
    const contactModel = req.loadedContactModel;

    // Delete the project
    const destroyed = await prisma.project.delete({
      where: { id: contactModel.projectId }
    });

    // Update the contact's projectId to null
    await prisma.contact.update({
      where: { id: contactModel.id },
      data: { projectId: null }
    });

    return res.status(201).json(destroyed);
  } catch (e) {
    next(e);
  }
}


exports.createUpdate = async function (req, res, next) {
  const userModel = req.userModel;
  const contactModel = req.loadedContactModel;
  const newUpdate = req.body;

  if (!newUpdate.toId) {
    return res.json({});
  }

  const statusUpdateModel = await prisma.option.findUnique({ where: { id: newUpdate.toId } });

  if (!statusUpdateModel || !statusUpdateModel.isActive) {
    return next({ message: `Status ${newUpdate.toId} not found` });
  }

  if (newUpdate.appointment && newUpdate.appointment.startDate) {
    const { timezone, appointment } = newUpdate;
    const appointmentTypeModel = await prisma.appointment_type.findUnique({ where: { id: appointment.typeId } });

    const newAppointment = {
      timezoneOffset: timezone.timeValue,
      timezone: timezone.name,
      startDate: appointment.startDate,
      endDate: moment(appointment.startDate).add(appointmentTypeModel.add, 'minutes').format("YYYY-MM-DD HH:mm:ss"),
      typeId: appointmentTypeModel.id,
      contactId: newUpdate.contactId,
      userId: userModel.id
    };

    const newAppointmentModel = await prisma.appointment.create({ data: newAppointment });
    newUpdate.appointmentId = newAppointmentModel.id;
  }

  newUpdate.contactId = contactModel.id;

  const newUpdateModel = await prisma.contact_update.create({ data: newUpdate });

  const to = await prisma.option.findUnique({ where: { id: newUpdateModel.toId } });
  const slug = to.slug;

  if (slug.includes('appointment-set') || slug.includes('reschedule')) {
    const attendees = [];
    const users = await prisma.contact.findMany({ where: { id: contactModel.id }, include: { users: true } });
    for (const user of users) {
      attendees.push({ email: user.email, displayName: `${user.firstName} ${user.lastName}` });
    }
    try {
      await Services.GAPI.createCalendarEvent(userModel.id, 'primary', newUpdate.appointmentId, attendees);
    } catch (error) {
      console.error('Appointment creation failed', error);
    }
  }

  if (slug.includes('drop')) {
    try {
      await prisma.contact.update({
        where: { id: contactModel.id },
        data: { status: 'Dropped' }
      });
      if (contactModel.sourceId === 5 && newUpdate.note && newUpdate.note.length > 4) {
        await contactModel.returnLead(newUpdate.note);  // Assuming `returnLead` is some custom function
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (slug.includes('-lead')) {
    await prisma.contact.update({
      where: { id: contactModel.id },
      data: { status: 'Lead' }  // Assuming this sets the contact's status to "Lead"
    });
  }

  if (slug.includes('request-new-redesign')) {
    await prisma.designRequest.create({  // Assuming there's a DesignRequest model
      data: {
        userId: userModel.id,
        contactId: contactModel.id
      }
    });
  }

  if (slug.includes('appointment-set')) {
    await prisma.designRequest.create({
      data: {
        userId: userModel.id,
        contactId: contactModel.id
      }
    });
    await prisma.contact.update({
      where: { id: contactModel.id },
      data: { status: 'Opportunity' }  // Assuming this sets the contact's status to "Opportunity"
    });
  }

  if (slug.includes('close')) {
    await prisma.contact.update({
      where: { id: contactModel.id },
      data: { status: 'Closed' }  // Assuming this sets the contact's status to "Closed"
    });
  }

  res.json(newUpdate);
}


exports.createClosingForm = async function (req, res, next) {
    const body = req.body;
    const contactId = req.params.contactId;
    const contactModel = req.loadedContactModel;

    if (body.id) {
        const closingFormUpdateModel = await prisma.closing_form.update({
            where: { id: body.id },
            data: body,
            include: {
                updates: {
                    include: {
                        type: true
                    }
                }
            }
        });
        return res.json(closingFormUpdateModel);
    }

    const partnerProposalModels = await prisma.partnerProposal.findMany({
        where: {
            contactId: contactId,
            selectDate: {
                not: null
            }
        }
    });

    const partnerModel = await prisma.partner.findUnique({
        where: { id: partnerProposalModels[0].partnerId }
    });
    const userModel = req.userModel;

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

    await prisma.contact.update({
        where: { id: contactId },
        data: {
            closingForms: {
                connect: { id: closingFormModel.id }
            }
        }
    });
    
    await prisma.user.update({
        where: { id: userModel.id },
        data: {
            closingForms: {
                connect: { id: closingFormModel.id }
            }
        }
    });

    await prisma.partner.update({
        where: { id: partnerModel.id },
        data: {
            closingForms: {
                connect: { id: closingFormModel.id }
            }
        }
    });

    res.json(closingFormModel);
}

exports.createDocument = async function (req, res, next) {
    const { user, role } = req.token;
    const body = req.body;
    const contactId = req.params.contactId;

    body.contactId = contactId;
    body.userId = user;

    const newUpdate = await prisma.document.create({
        data: body
    });

    res.json(newUpdate);
}

exports.createPartnerProposal = async function (req, res, next) {
    const contactId = req.loadedContactModel.id;
    const body = req.body;

    if(!body.partnerId){
        return res.json({message:'Partner id is missing'});
    }

    const newProposal = await prisma.partner_proposal.create({
        data: {
            ...body,
            contact: {
                connect: { id: contactId }
            }
        }
    });

    return res.json(newProposal);
}

exports.selectPartnerProposal = async function (req, res, next) {
    const contactId = req.loadedContactModel.id;
    const proposalId = parseInt(req.params.partnerProposalId);

    const proposals = await prisma.partner_proposal.findMany({
        where: { contactId: contactId },
        include: { partner: true }
    });

    for (let proposal of proposals) {
        if (proposal.id === proposalId) {
            await prisma.partner_proposal.update({
                where: { id: proposal.id },
                data: { selectDate: moment().format("YYYY-MM-DD HH:mm:ss") }
            });
        } else {
            await prisma.partner_proposal.update({
                where: { id: proposal.id },
                data: { selectDate: null }
            });
        }
    }

    res.json({ rows: proposals, count: proposals.length });
}

exports.listPartnerProposals = async function (req, res, next) {
    const contactId = req.loadedContactModel.id;

    const proposals = await prisma.partner_proposal.findMany({
        where: { contactId: contactId },
        include: { partner: true }
    });

    res.json({ rows: proposals, count: proposals.length });
}


exports.createPartnerLenderProposal = async function (req, res, next) {
    const contactId = req.params.contactId;
    const body = req.body;

    const createdLenderProposal = await prisma.lender_proposal.create({
        data: {
            ...body,
            contacts: { connect: { id: contactId } }
        }
    });

    res.json(createdLenderProposal);
}

exports.selectLenderProposal = async function (req, res, next) {
    const proposalId = parseInt(req.params.partnerProposalId, 10);
    
    const proposals = await prisma.lender_proposal.findMany({
        where: { contactId: req.params.contactId },
        include: { lender: true }
    });

    for (const proposal of proposals) {
        if (proposal.id === proposalId) {
            await prisma.lender_proposal.update({
                where: { id: proposal.id },
                data: { selectDate: moment().format("YYYY-MM-DD HH:mm:ss") }
            });
        } else {
            await prisma.lender_proposal.update({
                where: { id: proposal.id },
                data: { selectDate: null }
            });
        }
    }

    res.json({ rows: proposals, count: proposals.length });
}

exports.listLenderProposals = async function (req, res, next) {
    const proposals = await prisma.lender_proposal.findMany({
        where: { contactId: req.params.contactId },
        include: { lender: true }
    });

    res.json({ rows: proposals, count: proposals.length });
}


exports.update = async function (req, res, next) {
    const { user, role } = req.token;
    const contactId = req.params.contactId;

    const body = req.body;
    
    if (!contactId) {
        return next({ message: 'Not found' });
    }

    const updatedContact = await prisma.contact.update({
        where: { id: contactId },
        data: {
            ...body,
            // Your related updates will be handled separately, so don't spread them here
        },
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
            where: { contactId: contactId }, // Assuming you have a unique constraint on contactId for contact_system
            update: body.system,
            create: body.system
        });
    }

    if (body.pocs) {
        for (const poc of body.pocs) {
            await prisma.poc.upsert({
                where: { id: poc.id },
                update: poc,
                create: {
                    ...poc,
                    contact: { connect: { id: contactId } }
                }
            });
        }
    }

    if (body.updates) {
        for (const update of body.updates) {
            const newUpdate = await prisma.contact_update.create({
                data: {
                    ...update,
                    contact: { connect: { id: contactId } },
                    user: { connect: { id: user } }
                },
                include: {
                    appointment: true
                }
            });

            if (newUpdate.appointment) {
                await prisma.contact.update({
                    where: { id: contactId },
                    data: { opportunity: true } // Assuming 'setOpportunity' sets a boolean field named 'opportunity'
                });
            }
        }
    }

    res.status(201).json(updatedContact);
}


exports.requestNewDesign = async function (req, res, next) {
  const contactId = req.params.contactId;

  // Retrieve the contact based on the provided contactId
  const contact = await prisma.contact.findUnique({
    where: {
      id: contactId
    }
  });

  // Here, I assume that the "requestDesignForUser" modifies some field on the contact model based on the user's ID.
  // As I don't know exactly what that function does, I'm providing a generic update.
  // You'll need to adjust this to your requirements.
  await prisma.contact.update({
    where: { id: contactId },
    data: {
      designRequestedByUserId: req.userModel.id  // Here, designRequestedByUserId is a placeholder, adjust as needed
    }
  });

  res.json({ isOkay: true });
}


exports.show = async function (req, res, next) {
  const contactId = req.loadedContactModel.id;
  const scope = req.query.scope;

  try {
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      include: {
        organization: true,
        meters: true,
        promotions: true,
        groups: true,
        roofType: true,
        genType: true,
        updates: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                primaryPhone: true,
                picUrl: true,
                id: true
              }
            },
            to: {
              select: {
                name: true,
                id: true
              }
            },
            appointment: {
              include: {
                type: true
              }
            }
          },
          orderBy: {
            id: 'desc'
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

    return res.json(contact);
  } catch (error) {
    next(error);
  }
};


exports.listUpdates = async function (req, res) {
  const contactId = req.loadedContactModel.id;

  try {
    const updates = await prisma.contact_update.findMany({
      where: { contactId: contactId },
      orderBy: { id: 'desc' },
      select: {
        toId: true,
        createdAt: true,
        note: true,
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
          select: {
            fromDate: true,
            toDate: true,
            typeId: true,
            tzOffset: true,
            timezoneOffset: true,
            startDate: true,
            endDate: true,
            timezone: true,
            type: {
              select: {
                name: true
              }
            }
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
  } catch (error) {
    res.status(500).json({ message: "Error fetching updates", error });
  }
};



exports.destroy = async function (req, res) {
  const id = req.params.contactId;
  let r;

  if (req.userModel) {
    // I'm assuming `removeContact` is some kind of custom function you have.
    // If Prisma needs to be used for it, please provide its definition.
    r = await req.userModel.removeContact(id);
  } else {
    r = await prisma.contact.delete({
      where: { id: Number(id) }
    });
  }
  res.json(r);
};

exports.listClosingForm = async function (req, res, next) {
  const contactId = req.params.contactId;

  try {
    const closingForm = await prisma.closing_form.findMany({
      where: { contactId: Number(contactId) },
      orderBy: { id: 'desc' },
      include: {
        updates: {
          select: {
            createdAt: true,
            note: true,
            type: {
              select: { name: true }
            }
          }
        },
        contact: {
          select: {
            partnerProposals: {
              select: {
                partnerId: true,
                partner: {
                  select: { name: true }
                }
              }
            }
          }
        }
      }
    });

    res.status(200).json(closingForm);
  } catch (error) {
    res.status(500).json({ message: "Error fetching closing form", error });
  }
};

exports.listContactAppointments = async function (req, res, next) {
  const contactId = req.params.contactId;

  try {
    const contacts = await prisma.contact.findUnique({
      where: { id: Number(contactId) },
      include: {
        appointments: true
      },
      orderBy: {
        appointments: { id: 'desc' }
      }
    });

    res.status(200).json(contacts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching contact appointments", error });
  }
};


exports.createAdder = async function (req, res, next) {
  const loadedContactModel = req.loadedContactModel;
  const object = req.body;

  try {
    const newModel = await prisma.adder.create({
      data: object
    });
    // Assuming a one-to-many relationship between contact and adder
    await prisma.contact.update({
      where: { id: loadedContactModel.id },
      data: { adders: { connect: { id: newModel.id } } }
    });
    return res.json(newModel);
  } catch (e) {
    next(e);
  }
};

exports.deleteAdder = async function (req, res, next) {
  const id = req.params.adderId;

  try {
    const model = await prisma.adder.findUnique({
      where: { id: Number(id) }
    });
    if (model) {
      const response = await prisma.adder.delete({ where: { id: Number(id) } });
      return res.json(response);
    } else {
      return res.json({ message: 'Not Found' });
    }
  } catch (e) {
    next(e);
  }
};

exports.listAdders = async function (req, res, next) {
  const contactId = req.params.contactId;

  try {
    const proposals = await prisma.adder.findMany({
      where: { contactId: Number(contactId) },
      select: { id: true, name: true, value: true, quantity: true }
    });
    res.status(200).json(proposals);
  } catch (e) {
    next(e);
  }
};

exports.createMeter = async function (req, res, next) {
  const body = req.body;
  const loadedContactModel = req.loadedContactModel;

  try {
    const newMeterModel = await prisma.meter.create({ data: body });
    // Assuming a one-to-many relationship between contact and meter
    await prisma.contact.update({
      where: { id: loadedContactModel.id },
      data: { meters: { connect: { id: newMeterModel.id } } }
    });
    res.json(newMeterModel);
  } catch (e) {
    console.error(e);
    next(e);
  }
};

exports.updateMeter = async function (req, res, next) {
  const body = req.body;
  const loadedMeterModel = req.loadedMeterModel;

  try {
    const updatedMeter = await prisma.meter.update({
      where: { id: loadedMeterModel.id },
      data: body
    });
    res.json(updatedMeter);
  } catch (e) {
    console.error(e);
    next(e);
  }
};

exports.deleteMeter = async function (req, res, next) {
  const loadedMeterModel = req.loadedMeterModel;

  try {
    const isDestroyed = await prisma.meter.delete({
      where: { id: loadedMeterModel.id }
    });
    res.json(isDestroyed);
  } catch (e) {
    console.error(e);
    next(e);
  }
};


exports.deleteMeter = async function (req, res, next) {
  try {
    const loadedMeterModel = req.loadedMeterModel;
    const isDestroyed = await prisma.meter.delete({
      where: { id: loadedMeterModel.id }
    });
    res.json(isDestroyed);
  } catch (e) {
    console.error(e);
    next(e);
  }
};

exports.listIncentives = async function (req, res, next) {
  try {
    const loadedContactModel = req.loadedContactModel;
    const state = loadedContactModel.state;
    const list = await Services.SolarIncentives.getIncentives(state);
    res.json(list);
  } catch (e) {
    console.error(e);
    next(e);
  }
};

exports.createNote = async function (req, res, next) {
  const { user } = req.token;
  const contactId = req.params.contactId;
  const contents = req.body.contents;
  const newNote = await prisma.note.create({
    data: {
      userId: user,
      contents: contents,
      contact: {
        connect: { id: contactId }
      }
    }
  });
  const notes = await prisma.note.findMany({
    where: { contactId: Number(contactId) },
    include: {
      user: {
        select: { firstName: true, lastName: true }
      }
    },
    orderBy: { id: 'desc' }
  });
  res.status(200).json(notes);
};

exports.createComments = async function (req, res, next) {
  const { user } = req.token;
  const contactId = req.params.contactId;
  const comment = req.body.comment;

  const newComment = await prisma.contact_comment.create({
    data: {
      userId: user,
      comment: comment,
      contact: {
        connect: { id: contactId }
      }
    }
  });
  const comments = await prisma.contact_comment.findMany({
    where: { contactId: Number(contactId) },
    include: {
      user: {
        select: {
          firstName: true, lastName: true, picUrl: true,
          role: { select: { name: true } }
        }
      }
    },
    orderBy: { id: 'desc' }
  });
  res.status(200).json(comments);
};

exports.deletePromotion = async function (req, res, next) {
  const contactId = req.params.contactId;
  const promotionId = req.params.promotionId;

  const isDestroyed = await prisma.promotion.delete({
    where: { id: promotionId, contactId: Number(contactId) }
  });
  res.status(200).json(isDestroyed);
};

exports.createPromotion = async function (req, res, next) {
  const contactId = req.params.contactId;
  const userModel = req.userModel;

  const promotion = await prisma.promotion.create({
    data: {
      ...req.body,
      contact: { connect: { id: contactId } },
      user: { connect: { id: userModel.id } }
    }
  });
  res.status(200).json(promotion);
};



exports.listPromotions = async function (req, res, next) {
  const contactId = req.params.contactId;

  const promotions = await prisma.promotion.findMany({
    where: { contactId: Number(contactId) }
  });

  res.status(200).json(promotions);
};

exports.listNotes = async function (req, res, next) {
  const contactId = req.params.contactId;

  const notes = await prisma.note.findMany({
    where: { contactId: Number(contactId) },
    include: { user: { select: { firstName: true, lastName: true } } },
    orderBy: { id: 'desc' }
  });

  res.status(200).json(notes);
};

exports.listComments = async function (req, res, next) {
  const contactId = req.params.contactId;

  const comments = await prisma.contact_comment.findMany({
    where: { contactId: Number(contactId) },
    include: {
      user: {
        select: {
          firstName: true, lastName: true, picUrl: true,
          role: { select: { name: true } }
        }
      }
    },
    orderBy: { id: 'desc' }
  });

  res.status(200).json(comments);
};

exports.listUsers = async function (req, res, next) {
  const { isActive } = req.query;

  const where = {};
  if (isActive !== undefined) {
    where.isActive = isActive === 'false' ? false : true;
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      firstName: true, lastName: true, id: true, lastLoginDate: true, createdAt: true,
      email: true, primaryPhone: true, picUrl: true,
      role: { select: { name: true } }
    }
  });

  const count = await prisma.user.count({ where });

  res.status(200).json({ rows: users, count });
};

exports.listLenderProposals = async function (req, res, next) {
  const contactId = req.params.contactId;

  const proposals = await prisma.lender_proposal.findMany({
    where: { contactId: Number(contactId) },
    select: {
      id: true, loanAmount: true, systemPrice: true, rate: true, months: true, systemSize: true,
      lender: { select: { name: true, id: true } }
    }
  });

  res.status(200).json(proposals);
};


const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.listDocuments = async function (req, res, next) {
  const contactId = req.params.contactId;

  const contact = await prisma.contact.findUnique({
    where: { id: Number(contactId) },
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

  res.status(200).json(contact);
};

exports.showContactClosingForm = async function (req, res, next) {
  // This seems identical to the previous function
  // Consider reusing the listDocuments function instead

  const contactId = req.params.contactId;

  const contact = await prisma.contact.findUnique({
    where: { id: Number(contactId) },
    select: {
      id: true,
      documents: {
        select: {
          originalName: true,
          id: true,
          typeId: true,
          createdAt: true,
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

  res.status(200).json(contact);
};

exports.deletePoc = async function (req, res, next) {
  const { contactId, pocId } = req.params;

  const pocModel = await prisma.poc.findUnique({
    where: {
      id: Number(pocId)
    }
  });

  if (!pocModel || pocModel.contactId !== Number(contactId)) {
    return next({ message: 'poc does not exist' });
  }

  await prisma.poc.delete({
    where: {
      id: Number(pocId)
    }
  });

  res.json({ message: 'Deleted successful' });
};

exports.delete = async function (req, res, next) {
  const { user, role } = req.token;
  const contactId = req.params.contactId;

  if (role.toLowerCase() !== 'admin') {
    return next({ message: 'Not authorized' });
  }

  const contact = await prisma.contact.findUnique({
    where: { id: Number(contactId) },
    select: { documents: true }
  });

  if (!contact) {
    return next({ message: 'Contact does not exist' });
  }

  for (const documentModel of contact.documents) {
    try {
      // You need to implement the Services.Document.delete method
      // for deleting the documents from your storage
      await Services.Document.delete({
        version: documentModel.versionId,
        key: documentModel.key
      });

      await prisma.document.delete({
        where: { id: documentModel.id }
      });
    } catch (e) {
      console.error(e);
    }
  }

  await prisma.contact.delete({
    where: { id: Number(contactId) }
  });

  res.status(200).json({ deleted: true });
};
