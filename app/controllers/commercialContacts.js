/**
 * Module dependencies.
 */


const { wrap: async } = require('co');
const _ = require('lodash');
const {Op, QueryTypes} = require("sequelize");

const { models, query } = require('../../sequelize');

const moment = require("moment");
const { Services } = require('../services');
const sequalize = require("../../sequelize");



exports.list = async function (req, res, next) {
  const limit = parseInt(req.query.limit) || 2000;
  const offset = parseInt(req.query.offset) || 0;
  const order = req.query.order || 'DESC';

  const { user, role } = req.token;
  if (role.toLowerCase() !== 'admin') {
      return next({ message: 'Not authorized' });
  }

  let contactType = req.query.stage;
  let assignmentType = req.query.assignmentType;

  if (assignmentType && assignmentType === 'unassigned') {
      const groupId = 25;
      // This is a raw SQL part. Ideally, you should avoid raw SQL if possible with Prisma.
      // Adjust this part if you have more specific logic
      const rawSQL = `SELECT
      c.id,
          c.primaryphone,
          c.firstName,
          c.lastName,
          c.email,
          /* appointment start */
          subquery.createdAt,
          subquery.startDate,
          subquery.endDate,
          subquery.fromDate,
          subquery.toDate,
          subquery.tzOffset,
          subquery.timezoneOffset,
          /* appointment end */
          c.updateid
      FROM
      sunparison.roles r
      INNER JOIN sunparison.users u ON r.id = u.roleId
      INNER JOIN sunparison.contact_user cu ON u.id = cu.userId
      INNER JOIN sunparison.contacts c ON cu.contactId = c.id
      INNER JOIN sunparison.user_group_user ugu ON u.id = ugu.userId
      LEFT JOIN sunparison.contact_types ct ON c.typeId = ct.id
      LEFT JOIN (
          SELECT
      appointments.createdAt,
          appointments.startDate,
          appointments.endDate,
          appointments.fromDate,
          appointments.toDate,
          appointments.tzOffset,
          appointments.timezoneOffset,
          cupdates.contactId,
          appointments.userId
      FROM
      sunparison.contact_updates cupdates
      INNER JOIN sunparison.appointments appointments ON cupdates.appointmentId = appointments.id
      WHERE
      appointments.createdAt is not NULL
      ORDER BY
      appointments.createdAt DESC
      ) subquery ON subquery.contactId = c.id AND subquery.userId = u.id
      WHERE
      /* set all query relevant filters here */
      r.slug = 'setter'
      AND ugu.userGroupId = ${groupId}
      AND ct.slug = 'opportunity'
      AND c.isActive = TRUE
      /* subquery to select contacts that have one(!) user assigned only */
      AND (
          SELECT
      COUNT(userId)
      FROM
      sunparison.contact_user uc2
      WHERE
      uc2.contactId = c.id
      ) = 1
      ORDER BY
      c.id
  `;

      // For executing raw SQL with Prisma
      const queryResults = await prisma.$executeRaw(rawSQL);
      res.json(queryResults);
      return;
  }

  const contactTypeModel = await prisma.contact_type.findFirst({
      where: {
          slug: contactType
      }
  });

  if (!contactTypeModel) {
      return next({ message: `${contactType} not found` });
  }

  const whereCondition = {
      typeId: contactTypeModel.id,
      isActive: true
  }

  const obj_array = await prisma.contact.findMany({
      skip: offset,
      take: limit,
      orderBy: [
          { id: order },
          { leadDate: 'asc' },
      ],
      select: {
          isActive: true,
          createdAt: true,
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          leadDate: true,
          opportunityDate: true,
          updateId: true,
          primaryPhone: true,
          email: true,
          city: true,
          state: true,
          postalCode: true,
          address1: true,
          update: {
              select: {
                  note: true,
                  createdAt: true,
                  to: {
                      select: {
                          name: true,
                          id: true
                      }
                  }
              }
          },
          users: {
              select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  picUrl: true,
                  email: true,
                  primaryPhone: true
              }
          }
      },
      where: whereCondition
  });

  res.json(obj_array);
};

// List Contact Types
exports.listTypes = async function (req, res) {
  const data = await prisma.contact_type.findMany({
      where: {
          isActive: true
      }
  });
  res.json(data);
}

// List Contact Sources
exports.listSources = async function (req, res) {
  const data = await prisma.contact_source.findMany({
      where: {
          isActive: true
      }
  });
  res.json(data);
}

// List Generation Types
exports.listGenTypes = async function (req, res) {
  const data = await prisma.gen_type.findMany({
      where: {
          isActive: true
      }
  });
  res.json(data);
}

// Count Contacts
exports.count = async function (req, res) {
  const count = await prisma.contact.count();
  res.json({
      count: count,
  })
}




// Create a Contact
exports.create = async function(req, res, next) {
  try {
      const { user, role } = req.token;

      const userModel = await prisma.user.findUnique({
          where: { 
              AND: [
                  { id: user },
                  { isActive: true }
              ]
          }
      });

      const newContact = req.body;
      if (!userModel) {
          return next({ message: 'User not active' });
      }

      if (newContact.id) {
          const foundContact = await prisma.contact.findUnique({ where: { id: newContact.id } });
          if (userModel) {
              await prisma.user.update({
                  where: { id: userModel.id },
                  data: { contacts: { connect: { id: foundContact.id } } }
              });
          }
          return res.status(201).json(foundContact);
      }

      const genType = await prisma.user.findUnique({ where: { id: user }, include: { genType: true } });

      newContact.genTypeId = genType.id;
      const newContactModel = await prisma.contact.create({
          data: newContact,
          include: {
              genType: true,
              user1: {
                  include: {
                      role: true
                  }
              }
          }
      });

      if (userModel) {
          await prisma.user.update({
              where: { id: userModel.id },
              data: { contacts: { connect: { id: newContactModel.id } } }
          });
      }

      res.status(201).json(newContactModel);
  } catch (e) {
      console.error(e);
  }
}

// Create Update
exports.createUpdate = async function(req, res, next) {
  const { user, role } = req.token;
  const body = req.body;
  const contactId = req.params.contactId;
  body.contactId = contactId;
  body.userId = user;

  const newUpdate = await prisma.change.create({ data: body });
  res.json(newUpdate);
}

// Update Contact
exports.update = async function(req, res, next) {
  const contactModel = req.loadedContactModel;
  if (!contactModel) {
      return next({ message: 'contact not found' });
  }
  const body = req.body;

  const updatedContact = await prisma.contact.update({
      where: { id: contactModel.id },
      data: body
  });

  res.status(201).json(updatedContact);
}

exports.show = async function(req, res, next) {
  const { user, role } = req.token;
  const contactId = req.params.contactId;

  const contactModel = await prisma.contact.findUnique({
      where: { id: parseInt(contactId) },
      include: {
          notes: {
              orderBy: { id: 'desc' },
              include: {
                  user: {
                      select: { firstName: true, lastName: true }
                  }
              }
          },
          documents: {
              include: {
                  type: true
              }
          },
          lenderProposal: {
              include: {
                  lender: {
                      select: { id: true, name: true }
                  }
              }
          },
          partnerProposals: {
              include: {
                  partner: {
                      select: { id: true, name: true, userId: true }
                  }
              }
          },
          update: {
              include: {
                  from: {
                      select: { name: true, id: true }
                  },
                  user: {
                      select: { id: true, firstName: true, lastName: true }
                  },
                  to: {
                      select: { name: true, id: true, slug: true }
                  }
              }
          },
          genType: true,
          roofType: true,
          users: {
              include: {
                  role: true
              }
          },
          source: true,
          type: true,
          hoa: true,
          appointments: {
              include: { user: true }
          }
      }
  });

  if (!contactModel) {
      return next({ message: 'Homeowner not found' });
  }
  if (!contactModel.users) {
      return next({ message: 'No users assigned' });
  }

  const userIds = contactModel.users.map(u => u.id);

  if (role !== 'admin' && !userIds.includes(parseInt(user))) {
      return next({ message: 'Not authorized to view this page', code: 401 });
  }

  res.status(200).json(contactModel);
};



exports.listUpdates = async function (req, res) {
    const contactModel = req.loadedContactModel;
    
    const updates = await prisma.contact_update.findMany({
        orderBy: {
            id: 'desc'
        },
        where: {
            contactId: contactModel.id
        },
        select: {
            toId: true,
            createdAt: true,
            note: true,
            user: {
                select: { firstName: true, lastName: true }
            },
            to: {
                select: { name: true }
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
                        select: { name: true }
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
            update.appointment.startDate = moment(update.appointment.startDate).utcOffset(update.appointment.timezoneOffset).format();
            update.appointment.endDate = moment(update.appointment.endDate).utcOffset(update.appointment.timezoneOffset).format();
        }
        return update;
    });

    res.status(200).json(newData);
};

exports.destroy = async function(req, res) {
    const id = req.params.contactId;
    
    if (req.userModel) {
        // Assuming you have set up the relation to remove contacts through the userModel
        await req.userModel.update({
            where: { id: req.userModel.id },
            data: { contacts: { disconnect: { id } } }
        });
        res.status(204).end();
    } else {
        const r = await prisma.contact.delete({
            where: {
                id: parseInt(id)
            }
        });
        res.json(r);
    }
};




// contact/contactId/appointments
exports.getClosingForm = async function(req, res, next) {
  const contactId = parseInt(req.params.contactId);

  const closingForm = await prisma.closing_form.findFirst({
      where: {
          contactId
      },
      include: {
          update: {
              select: {
                  toId: true,
                  createdAt: true,
                  note: true,
                  to: {
                      select: { name: true }
                  }
              }
          },
          contact: {
              select: {
                  partnerProposalId: true,
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
};

// contact/contactId/appointments
exports.listContactAppointments = async function(req, res, next) {
  const contactId = parseInt(req.params.contactId);
  
  const contacts = await prisma.contact.findUnique({
      where: { id: contactId },
      include: {
          appointments: {
              orderBy: {
                  id: 'desc'
              }
          }
      }
  });

  res.status(200).json(contacts);
};




exports.listAdders = async function(req, res, next) {
  const contactId = parseInt(req.params.contactId);

  const proposals = await prisma.adder.findMany({
    where: {
      contactId
    },
    select: {
      id: true,
      name: true,
      value: true,
      quantity: true
    }
  });

  res.status(200).json(proposals);
};

exports.listIncentives = async function(req, res, next) {
  const contactId = parseInt(req.params.contactId);

  const proposals = await prisma.incentive.findMany({
    where: {
      contactId
    },
    select: {
      id: true,
      name: true,
      description: true,
      type: {
        select: {
          name: true,
          id: true
        }
      }
    }
  });

  res.status(200).json(proposals);
};

exports.createNote = async function(req, res, next) {
  const {user, role} = req.token;
  const contactId = parseInt(req.params.contactId);
  const contents = req.body.contents;

  const newNote = await prisma.note.create({
    data: {
      userId: user,
      contents: contents
    }
  });

  await prisma.contact.update({
    where: { id: contactId },
    data: {
      notes: {
        connect: { id: newNote.id }
      }
    },
    include: {
      notes: {
        select: {
          id: true,
          contents: true,
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          id: 'desc'
        }
      }
    }
  });

  res.status(200).json(newNote);
};

exports.listNotes = async function(req, res, next) {
  const contactId = parseInt(req.params.contactId);

  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: {
      notes: {
        select: {
          id: true,
          contents: true,
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          id: 'desc'
        }
      }
    }
  });

  res.status(200).json(contact.notes);
};

exports.listPartnerProposals = async function(req, res, next) {
  const contactId = parseInt(req.params.contactId);

  const proposals = await prisma.partner_proposal.findMany({
    where: {
      contactId
    },
    select: {
      id: true,
      url: true,
      createdAt: true,
      partner: {
        select: {
          name: true,
          id: true
        }
      }
    }
  });

  res.status(200).json(proposals);
};

exports.listUsers = async function(req, res, next) {
  const contactId = parseInt(req.params.contactId);

  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    select: {
      id: true,
      users: {
        select: {
          firstName: true,
          lastName: true,
          id: true,
          lastLoginDate: true,
          createdAt: true,
          email: true,
          primaryPhone: true,
          role: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });

  res.status(200).json(contact);
};

exports.listLenderProposals = async function(req, res, next) {
  const contactId = parseInt(req.params.contactId);

  const proposals = await prisma.lender_proposal.findMany({
    where: {
      contactId
    },
    select: {
      id: true,
      loanAmount: true,
      systemPrice: true,
      rate: true,
      months: true,
      systemSize: true,
      lender: {
        select: {
          name: true,
          id: true
        }
      }
    }
  });

  res.status(200).json(proposals);
};


exports.listDocuments = async function(req, res, next) {
  const contactId = parseInt(req.params.contactId);

  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
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
}

exports.showContactClosingForm = async function(req, res, next) {
  const contactId = parseInt(req.params.contactId);

  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
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
}

exports.delete = async function(req, res, next) {
  const { user, role } = req.token;

  if (role.toLowerCase() !== 'admin') {
    return next({ message: 'Not authorized' });
  }

  const contactId = parseInt(req.params.contactId);
  
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: { documents: true }
  });

  if (!contact) {
    return next({ message: 'Contact does not exist' });
  }

  if (contact.documents && contact.documents.length > 0) {
    for (let doc of contact.documents) {
      try {
        await Services.Document.delete({
          version: doc.versionId,
          key: doc.key
        });
        await prisma.document.delete({ where: { id: doc.id } });
      } catch (e) {
        console.error(e);
      }
    }
  }

  try {
    await prisma.contact.delete({ where: { id: contactId } });
    res.status(200).json({ deleted: true });
  } catch (e) {
    return next(e);
  }
}
