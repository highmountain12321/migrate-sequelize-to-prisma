const admin = require("firebase-admin");

/**
 * Module dependencies.
 */

const moment = require('moment');
const {Services} = require("../services");
const jwt = require('jsonwebtoken');
const _ = require("lodash");
const prisma = require('../lib/prisma')

exports.self = async function (req, res) {
  const userModel = req.userModel;

  if (req.query.customer && !userModel.stripeCustomerId) {
      return res.json({ success: false });
  }

  if (req.query.customer && userModel.stripeCustomerId) {
      // Assuming you have a relation setup in Prisma schema
      const stripeCustomer = await prisma.user.findUnique({
          where: { id: userModel.id },
          select: { customer: true } // Adjust this based on your Prisma schema and relations
      });
      return res.json(stripeCustomer);
  }

  const managedGroups = await prisma.group.findMany({ 
      where: { managerId: userModel.id } 
  });
  userModel.managedGroups = managedGroups;
  res.json(userModel);
}

exports.updateSelf = async function (req, res) {
  const updateSelf = req.body;
  const userModel = req.userModel;

  await prisma.user.update({
      where: { id: userModel.id },
      data: updateSelf
  });

  const firebaseUpdate = {};
  if (updateSelf.firstName) {
      firebaseUpdate.displayName = `${updateSelf.firstName} ${updateSelf.lastName}`;
  }
  if (updateSelf.picUrl) {
      firebaseUpdate.photoURL = updateSelf.picUrl;
  }

  if (Object.keys(firebaseUpdate).length > 0) {
      await userModel.updateFirebaseUser(firebaseUpdate);
  }

  const updatedUser = await prisma.user.findUnique({ where: { id: userModel.id } });
  res.json(updatedUser);
}


exports.getExternalUser = async function (req, res, next) {
  const userId = req.params.userId;
  const userModel = await prisma.user.findUnique({ where: { id: userId } });

  if (!userModel) {
      return next({ message: 'user not found' });
  }

  return res.json({
      firstName: userModel.firstName,
      lastName: userModel.lastName
  });
}

exports.createExternalContact = async function (req, res, next) {
  const userId = req.params.userId;
  const userModel = await prisma.user.findUnique({ where: { id: userId } });

  if (!userModel) {
      return next({ message: 'Rep not found' });
  }

  try {
      const newContact = req.body;
      let sourceId;
      let sourceModel;

      if (newContact.sourceId) {
          sourceId = newContact.sourceId;
          delete newContact.sourceId;

          if (sourceId) {
              sourceModel = await prisma.contact_source.findUnique({ where: { id: sourceId } });
          }
      }

      if (!sourceModel) {
          sourceModel = await prisma.contact_source.findFirst({ where: { isDefault: true } });
      }

      newContact.sourceId = sourceModel.id;

      // Assuming the relationship exists between user and genType
      const genType = await prisma.genType.findFirst({ where: { userId: userModel.id } });
      newContact.genTypeId = genType.id;

      const newContactModel = await prisma.contact.create({
          data: newContact,
          include: {
              pocs: true,          // This assumes a relation is set up in Prisma schema
              genType: true        // This assumes a relation is set up in Prisma schema
          }
      });

      if (newContact.pocs) {
          for (let poc of newContact.pocs) {
              poc.contactId = newContactModel.id;
              await prisma.poc.upsert({
                  where: { id: poc.id ? poc.id : 0 },
                  create: poc,
                  update: poc
              });
          }
      }

      if (userModel) {
          let name = '';
          let phone = '';
          if (newContact.busName) {
              name = newContactModel.busName;
              phone = newContactModel.primaryPhone || (newContactModel.pocs && newContactModel.pocs[0]?.phone);
          } else {
              name = `${newContactModel.firstName} ${newContactModel.lastName}`;
              phone = newContactModel.primaryPhone;
          }

          try {
              // Assuming this method is provided elsewhere in your codebase
              await userModel.sendEmail({
                  templateName: 'newContact',
                  parameters: {
                      header: 'Contact Was Added To Your Account',
                      name,
                      phone
                  }
              });
          } catch (e) {
              console.error('couldnt send leadform email ', e);
          }

          // Assuming addContact is a method you've defined elsewhere to handle adding the contact to the user
          await userModel.addContact(newContactModel);
      }

      res.status(201).json({ message: 'Added', contactId: newContactModel.id });

  } catch (e) {
      console.error(e);
      res.status(500).json({ message: e.message });
  }
}


exports.accountReady = async function (req, res, next) {
  const fid = req.params.fid;
  const targetUser = await prisma.user.findFirst({ where: { fid } });
  if (!targetUser) {
      res.status(500).json({ isReady: false });
  } else {
      res.status(200).json({ isReady: true });
  }
}

exports.migrate = async function (req, res, next) {
  const userId = req.params.userId;
  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser.fid) {
      // await targetUser.syncFirebaseUser(); // This method is not provided.
      res.status(200).json({ isMigrated: true });
  } else {
      res.status(200).json({ isMigrated: true });
  }
}


exports.loginAs = async function (req, res, next) {
  const userId = req.params.userId;
  try {
      const targetUser = await prisma.user.findUnique({ where: { id: userId } });
      setTimeout(async () => {
          // await targetUser.syncFirebaseClaims(); // This method is not provided.
          const token = await targetUser.getFirebaseAuthToken(); // Assuming this is a custom method you have
          return res.status(200).send({ token });
      }, 8000);
  }
  catch (error) {
      console.error(error);
      next(error);
  }
}


exports.list = async function (req, res) {
  let { roleIds, isActive = true, q, limit = 500, offset = 0, name, organizationFilter, scope = "basic" } = req.query;

  let where = {
      isActive
  };

  if (q && q.length > 2) {
      // Adjust based on your services.
      where = { ...where, OR: Services.Search.query(q) };
  }

  if (name && name.length > 0) {
      // Adjust based on your services.
      where = { ...where, OR: Services.Search.repName(name) };
  }

  const query = {
      skip: offset,
      take: limit,
      where,
      orderBy: { id: 'desc' },
      include: {
          user_group: true,
          role: { select: { name: true, id: true } },
          organization: { select: { name: true, id: true } }
      }
  };

  if (roleIds) {
      if (typeof roleIds === 'string') {
          roleIds = roleIds.includes(',') ? roleIds.split(',').map(Number) : [Number(roleIds)];
      }
      query.where = { ...query.where, roleId: { in: roleIds } };
  }

  const userModel = req.userModel;
  const isAdmin = await userModel.isAdmin(); // Assuming this is a custom method you have

  if (organizationFilter) {
      if (typeof organizationFilter === 'string') {
          organizationFilter = organizationFilter.includes(',')
              ? organizationFilter.split(',').map(Number)
              : [Number(organizationFilter)];
      }
      query.where = { ...query.where, organizationId: { in: organizationFilter } };
  }

  if (!isAdmin) {
      query.where = { ...query.where, organizationId: userModel.organizationId };
  }

  const users = await prisma.user.findMany(query);

  res.json(users);
}


exports.listAppointments = async function (req, res) {
    const userId = req.params.userId;
    const from = req.query.from;
    const to = req.query.to;
    let ww = {};

    if (from && to) {
        ww = {
            AND: [
                { startDate: { gte: new Date(from) } },
                { endDate: { lte: new Date(to) } }
            ]
        };
    }

    const userModel = await prisma.user.findUnique({ where: { id: userId }, include: { contacts: true } });
    const contactIds = userModel.contacts.map(c => c.id);
    ww.contactId = { in: contactIds };

    const data = await prisma.appointment.findMany({
        where: {
            ...ww,
            isActive: true
        },
        include: {
            contact: { select: { email: true, primaryPhone: true, firstName: true, lastName: true, id: true, name: true, busName: true } },
            type: { select: { name: true } }
        },
        orderBy: { startDate: 'asc' }
    });

    const newData = data.map(appt => {
        if (appt.tzOffset) {
            appt.startDate = moment(appt.fromDate).utcOffset(appt.tzOffset, true).format();
            appt.endDate = moment(appt.toDate).utcOffset(appt.tzOffset, true).format();
        }
        if (appt.startDate && appt.timezoneOffset) {
            appt.startDate = moment(appt.startDate).utcOffset(appt.timezoneOffset, true).format();
            appt.endDate = moment(appt.endDate).utcOffset(appt.timezoneOffset, true).format();
        }
        return appt;
    });

    res.json(newData);
};

exports.listGroups = async function (req, res) {
  const userModel = req.loadedUserModel;
  const { isManager, isActive = true } = req.query;

  if (!isManager) {
      const userGroups = await prisma.user.findUnique({
          where: { id: userModel.id },
          include: {
              groups: {
                  where: { isActive },
                  include: { type: { select: { id: true, name: true } } },
                  orderBy: { id: 'desc' }
              }
          }
      });

      return res.json({ rows: userGroups.groups });
  }

  if (isManager === 'true') {
      const managed = await prisma.user.findUnique({
          where: { id: userModel.id },
          include: {
              managedGroups: {
                  where: { isActive },
                  include: { type: { select: { id: true, name: true } } },
                  orderBy: { id: 'desc' }
              }
          }
      });

      return res.json({ rows: managed.managedGroups });
  }

  res.json({ rows: [] });
};

exports.show = async function (req, res) {
  const loadedUserModel = req.loadedUserModel;

  if (req.query.customer && !loadedUserModel.stripeCustomerId) {
      return res.json({ success: false });
  }

  if (req.query.customer && loadedUserModel.stripeCustomerId) {
      // I assume you have a method like getCustomer for fetching customer data from Stripe.
      const stripeCustomer = await loadedUserModel.getCustomer();
      return res.json(stripeCustomer);
  }

  const userWithManagedGroupsAndOrg = await prisma.user.findUnique({
      where: { id: loadedUserModel.id },
      include: {
          managedGroups: true,
          organization: { select: { name: true, id: true } }
      }
  });

  res.json(userWithManagedGroupsAndOrg);
};


exports.create = async function(req, res, next) {
  try {
    await prisma.user.create({ data: req.body }); // Adjust for Prisma model structure
    res.status(201).end();
  } catch (err) {
    next(err);
  }
}

exports.count = async function(req, res, next) {
  try {
    const count = await prisma.user.count(); // Assuming you have a User model in Prisma
    res.json({
      count: count,
    });
  } catch (err) {
    next(err);
  }
}

exports.patchContact = async function(req, res, next) {
  const loadedUserModel = req.loadedUserModel; // Assuming you've translated this for Prisma
  try {
    const addContactId = req.body.add;
    const removeContactId = req.body.remove;

    if (addContactId) {
      const contactModel = await prisma.contact.findUnique({ where: { id: addContactId } }); // Assuming you have a Contact model in Prisma
    
      const latestAppointments = await prisma.appointment.findMany({
        where: {
          contactId: contactModel.id
        },
        orderBy: [
          {
            createdAt: 'desc'
          }
        ],
        take: 1
      });
      const latestAppointment = latestAppointments[0];
    
      // Assuming you want to add the contact to the user's contacts
      await prisma.user.update({
        where: {
          id: loadedUserModel.id
        },
        data: {
          contacts: {
            connect: {
              id: contactModel.id
            }
          }
        }
      });
    
      try {
        const name = contactModel.busName ? contactModel.busName : `${contactModel.firstName} ${contactModel.lastName}`;
        // Replace this with your Prisma logic for sending an email
        // await loadedUserModel.sendEmail({
        //   templateName: 'newContact',
        //   parameters: {
        //     header: 'Contact Was Assigned to You',
        //     name,
        //     phone: `${contactModel.primaryPhone}`
        //   }
        // });
      } catch (e) {
        console.error(e);
        console.error('send email');
      }
    
      try {
        const name = contactModel.busName ? contactModel.busName : `${contactModel.firstName} ${contactModel.lastName}`;
        const message = `New Contact (${name}) was assigned to you. Please login to G3.app for more details.`;
        // Replace this with your Prisma logic for sending an SMS
        // await loadedUserModel.sendSMS(message);
      } catch (e) {
        console.error(e);
        console.error('send SMS');
      }
    
      if (latestAppointment) {
        const attendees = [];
        const users = await prisma.user.findMany({ // Assuming you have a User model in Prisma
          where: {
            contacts: {
              some: {
                id: contactModel.id
              }
            }
          }
        });
    
        for (let i = 0; i < users.length; i++) {
          attendees.push({ email: users[i].email, displayName: `${users[i].firstName} ${users[i].lastName}` });
        }
    
        try {
          // Replace this with your Prisma logic for creating a calendar event
          // await Services.GAPI.createCalendarEvent(loadedUserModel, 'primary', latestAppointment.id, attendees);
        } catch (error) {
          console.error('appointment didnt work', error);
        }
      }
    
      return res.status(201).json({ isOkay: true });
    }
    

    if (removeContactId) {
      const contactModel = await prisma.contact.findUnique({ where: { id: removeContactId } });
    
      const latestAppointments = await prisma.appointment.findMany({
        where: {
          contactId: contactModel.id
        },
        orderBy: [
          {
            createdAt: 'desc'
          }
        ],
        take: 1
      });
      const latestAppointment = latestAppointments[0];
    
      // Assuming you want to remove the contact from the user's contacts
      await prisma.user.update({
        where: {
          id: loadedUserModel.id
        },
        data: {
          contacts: {
            disconnect: {
              id: contactModel.id
            }
          }
        }
      });
    
      if (latestAppointment) {
        const attendees = [];
        const users = await prisma.user.findMany({ // Assuming you have a User model in Prisma
          where: {
            contacts: {
              some: {
                id: contactModel.id
              }
            }
          }
        });
    
        for (let i = 0; i < users.length; i++) {
          attendees.push({ email: users[i].email, displayName: `${users[i].firstName} ${users[i].lastName}` });
        }
    
        try {
          // Replace this with your Prisma logic for removing the calendar event
          // await Services.GAPI.createCalendarEvent(loadedUserModel, 'primary', latestAppointment.id, attendees);
        } catch (error) {
          console.error('appointment didnt work', error);
        }
      }
    
      return res.status(201).json({ isOkay: true });
    }
    
  } catch (e) {
    console.error(e.message);
    next(e);
  }
}


exports.update = async function (req, res, next) {
  const userModel = req.userModel;
  const loadedUserModel = req.loadedUserModel;
  const id = req.params.userId;
  const body = req.body;

  if (!userModel.isAdmin() && userModel.id !== parseInt(id)) {
    return res.json({ message: 'Not authorized' });
  }

  try {
    const updateData = { ...body };

    if (body.organization) {
      updateData.organization = {
        connect: {
          id: body.organization.id,
        },
      };
    }

    const firebaseUpdate = {};

    if (body.firstName) {
      firebaseUpdate.displayName = `${body.firstName} ${body.lastName}`;
    }
    if (body.picUrl) {
      firebaseUpdate.photoURL = body.picUrl;
    }
    if (body.isActive === false || body.isActive === true) {
      firebaseUpdate.disabled = body.isActive ? false : true;
    }

    if (Object.keys(firebaseUpdate).length > 0) {
      // Assuming you have a Prisma method for updating Firebase users
      await prisma.user.update({
        where: {
          id: loadedUserModel.id,
        },
        data: firebaseUpdate,
      });
    }

    await prisma.user.update({
      where: {
        id: loadedUserModel.id,
      },
      data: updateData,
    });

    res.status(201).json();
  } catch (e) {
    next(e);
  }
};

exports.logout = function(req, res) {
  req.logout();
  res.redirect('/login');
};
exports.listDocuments = async function (req, res, next) {
  const id = req.params.userId;
  const where = req.params.filter;
  const query = {
    where: {
      id: id,
    },
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
              slug: true,
            },
          },
        },
      },
    },
  };
  const user = await prisma.user.findUnique(query);

  res.status(200).json(user);
};

exports.listProjects = async function (req, res, next) {
  const { user, role } = req.token;
  const id = req.params.userId;
  if (role !== 'admin' && id != user) {
    return next({ message: 'Not authorized' });
  }

  const query = {
    where: {
      id: user,
    },
    select: {
      id: true,
      projects: {
        select: {
          createdAt: true,
          id: true,
          update: {
            select: {
              note: true,
              createdAt: true,
              to: {
                select: {
                  name: true,
                  id: true,
                },
              },
            },
          },
          partnerUser: {
            select: {
              firstName: true,
              partner: {
                select: {
                  name: true,
                },
              },
            },
          },
          contact: {
            select: {
              primaryPhone: true,
              firstName: true,
              lastName: true,
              address1: true,
              city: true,
              state: true,
              postalCode: true,
            },
          },
        },
        orderBy: {
          id: 'desc',
        },
      },
    },
  };

  const userRecord = await prisma.user.findUnique(query);

  res.json(userRecord);
};

exports.listIntegrations = async function (req, res, next) {
  const { user, role } = req.token;
  const id = req.params.userId;
  const query = {
    where: {
      id: id,
    },
    select: {
      id: true,
      integrations: {
        select: {
          name: true,
          isActive: true,
          createdAt: true,
        },
      },
    },
  };

  const userRecord = await prisma.user.findUnique(query);

  res.json(userRecord);
};

exports.listApiKeys = async function (req, res, next) {
  const { user, role } = req.token;
  const id = req.params.userId;
  const query = {
    where: {
      id: id,
    },
    select: {
      id: true,
      api_keys: {
        select: {
          token: true,
          isActive: true,
          createdAt: true,
        },
      },
    },
  };

  const userRecord = await prisma.user.findUnique(query);

  res.json(userRecord);
};


exports.listContacts = async function (req, res, next) {
  const { propertyTypeId, isActive = true, q, statusFilter, stageId } = req.query;
  const loadedUserModel = req.loadedUserModel;

  const where = {
    isActive
  }

  if (q && q.length > 1) {
    where.OR = Services.Search.query(q); // Assuming `Services.Search.query(q)` returns the appropriate condition
  }

  const query = {
    where,
    select: {
      isActive: true,
      id: true,
      leadDate: true,
      opportunityDate: true,
      firstName: true,
      lastName: true,
      primaryPhone: true,
      email: true,
      address1: true,
      city: true,
      state: true,
      postalCode: true,
      busName: true,
      name: true,
      users: {
        select: {
          firstName: true,
          lastName: true,
          picUrl: true,
          role: {
            select: {
              name: true
            }
          }
        }
      },
      updates: {
        select: {
          id: true,
          note: true,
          createdAt: true,
          to: {
            select: {
              name: true,
              id: true,
              slug: true
            }
          }
        },
        orderBy: {
          id: 'DESC'
        },
        take: 1
      },
      stage: {
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
    }
  };

  if (stageId) {
    query.include.push({
      stage: {
        where: {
          id: stageId
        }
      }
    });
  }

  if (propertyTypeId) {
    query.include.push({
      propertyType: {
        where: {
          id: propertyTypeId
        }
      }
    });
  }

  if (statusFilter) {
    query.include = {
      ...query.include,
      updates: {
        where: {
          OR: Services.Search.statusFilter(statusFilter)
        },
        take: 1
      }
    };
  }

  const rows = await prisma.user.findUnique({
    where: {
      id: loadedUserModel.id
    },
    select: {
      contacts: query
    }
  });

  const count = rows.contacts.length;

  res.status(200).json({ rows: rows.contacts, count });
}


exports.createContact = async function (req, res, next) {
  const { user, role } = req.token;
  const userId = req.params.userId;
  const userModel = await prisma.user.findUnique({
    where: {
      id: userId
    }
  });

  try {
    const newContact = req.body;

    const genType = await prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        genType: {
          select: {
            id: true
          }
        }
      }
    });

    newContact.genTypeId = genType.genType.id;

    if (newContact.updates) {
      newContact.updates.forEach((u) => {
        u.userId = user;
      });
    }

    const newContactModel = await prisma.contact.create({
      data: {
        ...newContact,
        system: {},
        updates: {
          create: newContact.updates
        },
        pocs: {},
        genType: {
          connect: {
            id: newContact.genTypeId
          }
        }
      },
      include: {
        updates: {
          include: {
            appointment: true
          }
        }
      }
    });

    if (newContactModel) {
      const updates = newContactModel.updates;

      if (updates && updates.length > 0) {
        const appointmentModel = updates[0].appointment;

        if (appointmentModel) {
          await prisma.appointment.update({
            where: {
              id: appointmentModel.id
            },
            data: {
              userId: user,
              contactId: newContactModel.id
            }
          });
        
          await prisma.contact.update({
            where: {
              id: newContactModel.id
            },
            data: {
              opportunityDate: new Date() // Assuming this is how you set opportunityDate
            }
          });
        
          // Generate JWT token
          const token = jwt.sign({ user: userModel.id, sub: userModel.id, role: 'readOnly' }, process.env.JWT_TOKEN, {
            expiresIn: '1w'
          });
        
          const redirectUrl = `${process.env.FRONTEND_URL}/sale/contacts/${newContactModel.id}/proposals`;
          const finalUrl = `${process.env.FRONTEND_URL}/#token=${token}&redirect=${redirectUrl}`;
        
          const name = newContactModel.busName ? `*Business:* ${newContactModel.busName}` : `*Homeowner:*  ${newContactModel.firstName} ${newContactModel.lastName}`;
        
          // Send Slack notification
          await Services.Slack.send({
            "blocks": [
              {
                "type": "divider"
              },
              {
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": ` \n
                         ${name} (${newContactModel.id}) \n *avg Monthly Bill:* ${newContactModel.avgMonthlyBill} \n *Utility Provider:* ${newContactModel.utilityProvider} \n *Address:*  ${newContactModel.fullAddress} \n *Requested By:*  ${userModel.firstName}  ${userModel.lastName}  (${userModel.id} / ${role}) \n *login:* ${finalUrl}`
                }
              },
              {
                "type": "divider"
              },
              {
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": `*login:* ${finalUrl}`
                }
              },
              {
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": "Add Proposals"
                },
                "accessory": {
                  "type": "button",
                  "text": {
                    "type": "plain_text",
                    "text": "Login",
                    "emoji": true
                  },
                  "value": "click_me_123",
                  "url": finalUrl,
                  "action_id": "button-action"
                }
              }
            ]
          });
        }
        
      }

      if (userModel) {
        await prisma.user.update({
          where: {
            id: userModel.id
          },
          data: {
            contacts: {
              connect: {
                id: newContactModel.id
              }
            }
          }
        });

        try {
          await prisma.contact_event.create({
            data: {
              contactId: newContactModel.id,
              userId: userModel.id,
              typeId: 1
            }
          });
        } catch (e) {
          console.error('FAILED TO CREATE EVENT ', e.message);
        }
      }

      res.status(201).json(newContactModel);
    }
  } catch (e) {
    console.error(e);
  }
}

exports.listClosingForms = async function (req, res, next) {
  const { user, role } = req.token;
  const userId = req.params.userId;

  if (role !== 'admin' && parseInt(userId) !== parseInt(userId)) {
    return next({ message: 'not authorized' });
  }

  const closingforms = await prisma.closingForm.findMany({
    where: {
      submittedById: userId
    },
    include: {
      contact: {
        include: {
          stage: true,
          lenderProposals: {
            include: {
              lender: {
                select: {
                  name: true
                }
              }
            },
            select: {
              months: true,
              years: true,
              rate: true,
              loanAmount: true,
              systemPrice: true,
              isCash: true,
              cashAmount: true,
              id: true,
              ppwNet: true,
              ppwGross: true,
              systemSize: true
            }
          },
          promotions: true,
          genType: {
            select: {
              name: true
            }
          },
          partnerProposals: {
            include: {
              partner: {
                select: {
                  name: true
                }
              }
            },
            select: {
              partnerId: true,
              url: true
            }
          },
          users: {
            include: {
              role: {
                select: {
                  name: true
                }
              }
            },
            select: {
              firstName: true,
              lastName: true,
              roleId: true
            }
          }
        }
      },
      status: true
    },
    orderBy: {
      id: 'desc'
    }
  });

  res.json({
    rows: closingforms
  });
}
