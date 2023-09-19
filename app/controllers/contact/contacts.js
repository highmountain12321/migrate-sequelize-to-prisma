const { wrap: async } = require('co');
const _ = require('lodash');
const { Op, QueryTypes, Sequelize } = require("sequelize");
const { models, query } = require('../../../sequelize');
const moment = require("moment");
const { Services } = require('../../services');
const jsonexport = require('jsonexport');


exports.list = async function (req, res, next) {
  let { assignment = 'all',userId, states, genType, sourceId, propertyTypeId = 1, isActive=true, stageId, q, statusFilter, limit=100, offset=0, sort, organizationFilter, fileType=false } = req.query;

  const userModel = req.userModel;
  const responseState = {
    userId
  }

  const where = {
    isActive
  }
  if(assignment === 'unassigned'){
    where['$users.id$'] =  Sequelize.where(Sequelize.col('users.id'),null);
  }
  if(states){
    where.state =  Sequelize.where(Sequelize.col('state'),{
      [Op.in]: states.toString().indexOf(',') > -1 ? states.split(',') : [states],
    });
  }
  if(userId){
    where['$users.id$'] =  Sequelize.where(Sequelize.col('users.id'),userId);
  }


  /*
   if(sourceId){
     where['$source.id$'] = sourceId;
   }

   */


  if (q) {
    where[Op.or] = Services.Search.query(q, propertyTypeId);
  }


  const query = {
    limit,
    offset,
    order: [[Sequelize.literal(`id`), `DESC`]],
    subQuery:false,
    where,
    include: [{
      required: false,
      model: models.user,
      as: 'users',
      attributes: ['id', 'firstName', 'lastName'],
      include:[{
        required: false,
        model: models.role,
        as:'role',
        attributes: ['name'],
      }]
    },{
      required: false,
      separate: true,
      model: models.contact_update,
      order: [['id', 'DESC']],
      as: 'updates',
      limit: 1,
      include: [{
        model: models.option,
        as: 'to'
      }
      ]
    },
      {
        required: false,
        model: models.contact_stage,
        as: 'stage',
        attributes: [
          'name', 'id'
        ]
      },{
      required: false,
      model: models.organization,
      as: 'organization',
      attributes: [
        'name', 'id'
      ]
    },{
      required: false,
      model: models.contact_source,
      as: 'source',
        attributes: [
          'name', 'id'
        ]
    }, {
      required: false,
      model: models.user_group,
      attributes: ['name', 'id'],
      as: 'groups',
      include: [{
        attributes: ['name','id'],
        as: 'type',
        model: models.user_group_type
      }]
    }, {
      required: false,
      model: models.gen_type,
      as: 'genType',
      attributes: [
        'name', 'slug', 'id'
      ]
    },{
        required: false,
        model: models.property_type,
        as: 'propertyType',
        attributes: [
          'name', 'id'
        ]
      }
    ],
  }

  if(propertyTypeId === 2){
    delete query.limit;
    delete query.offset;
  }


  if(organizationFilter){
    where.organizationId = organizationFilter.toString().indexOf(',') > -1 ? organizationFilter.split(',') : [organizationFilter]
  }



  /// add Sort
  // query.order.unshift([queryFilter.sortObject.column, queryFilter.sortObject.direction]);


  if (stageId) {
    const stageInclude = (_.find(query.include, { as: 'stage' }));
    stageInclude.required = true;
    stageInclude.where = {
      id: stageId
    }
  }


  if (sourceId) {
    const sourceInclude = (_.find(query.include, { as: 'source' }));
    sourceInclude.required = true;
    sourceInclude.where = {
      id: sourceId
    }
  }

  if (propertyTypeId) {
    const propertyTypeInclude = (_.find(query.include, { as: 'propertyType' }));
    propertyTypeInclude.required = true;
    propertyTypeInclude.where = {
      id: propertyTypeId
    }
  }




  if (statusFilter) {
    const updatesInclude = (_.find(query.include, { as: 'updates' }));
    query.order.push([{ model: models.contact_update, as: 'updates' }, 'id', 'DESC'])
    updatesInclude.separate = false;
    updatesInclude.required = true;
    updatesInclude.include[0].required = true;
    updatesInclude.include[0].where = {
      [Op.or]: Services.Search.statusFilter(statusFilter)
    }
  }

  const isAdmin = await userModel.isAdmin();

  if (isAdmin) {
    if(fileType != 'csv') {
      query.include.push({
        required: false,
        model: models.contact_automation_run,
        as: 'automation_runs',
        attributes: ['id', 'createdAt'],
        include: [{
          model: models.auto_automation,
          as: 'automation',
          attributes: ['id', 'name'],
        }]
      });
    }

    // tslint:disable-next-line:no-shadowed-variable
    if(fileType === 'csv'){
      query.subQuery = true;
//      console.log('WTF ',query);
      const rows = await models.contact.findAll(query);

      const data = rows.map((m)=>{
        const status = m.updates[0] ? m.updates[0].to.name : '';
        const source = m.source ? m.source.name : '';

        const name = m.busName ? m.busName : m.firstName + ' '+ m.lastName;
        return {
          createdAt:m.createdAt,
          status,
          name,
          source,
          primaryPhone:m.primaryPhone,
          email:m.email,
          address1:m.address1,
          city:m.city,
          state:m.state,
          postalCode:m.postalCode,
        }
      });

      const csv = await jsonexport(data);
      res.setHeader("content-disposition", `attachment; filename=file.csv`);
      res.setHeader("Content-Type", "text/csv");
      res.attachment('file.csv');
      return res.status(200).send(csv);
    }else {
      let {rows, count} = await models.contact.findAndCountAll(query);
      if(propertyTypeId === 2){
        rows = rows.slice(offset, limit);
      }
      res.json({rows, count:count});
      return;
    }
  } else {

    const contacts = await userModel.getContacts(query)
    const countContacts = await userModel.countContacts(query)


    if(fileType === 'csv') {

      const {rows, count} = await models.contact.findAndCountAll(query);

      const data = rows.map((m) => {
        const status = m.updates[0] ? m.updates[0].to.name : '';
        const name = m.busName ? m.busName : m.firstName + ' ' + m.lastName;
        return {
          createdAt: m.createdAt,
          status,
          name,
          primaryPhone: m.primaryPhone,
          email: m.email,
          address1: m.address1,
          city: m.city,
          state: m.state,
          postalCode: m.postalCode,
        }
      });
      const csv = await jsonexport(data);
      res.setHeader("content-disposition", `attachment; filename=file.csv`);
      res.setHeader("Content-Type", "text/csv");
      res.attachment('file.csv');
      return res.status(200).send(csv);
    }else {

      const {rows, count} = await models.contact.scope('basic').findAndCountAll(query);
      res.json({rows:contacts, count: countContacts, state:responseState});
    }
  }
}

exports.listGroups = async function (req, res) {
  const contactId = req.params.contactId;
  const query = {
    include: [{
      model: models.user_group,
      as: 'groups',
      attributes: ['name', 'id'],
      where: {
        isActive: true
      },
      include: [{
        model: models.user_group_type,
        as: 'type',
        attributes: ['name', 'id'],
        where: {
          isActive: true
        }
      }]
    }]
  };

  const results = await models.contact.findByPk(contactId, query);
  let rows = [];
  if (results) {
    rows = results.groups;
  }
  res.json({ rows, count: 100 });
}


exports.count = async function (req, res) {
  const count = await models.contact.count();
  res.json({
    count: count,
  })
}



/**
 * Create a contact
 */

exports.runAutomation = async function (req, res, next) {
  try {
    const userModel = req.userModel;
    const loadedContactModel = req.loadedContactModel;
    const loadedAutomationModel = req.loadedAutomationModel;
    const response = await loadedContactModel.runAutomation(loadedAutomationModel.id, {manual:true});
    return res.status(201).json(response);
  } catch (e) {
    next(e);
  }
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
    newContact.sourceId = 11; // source is REP;

    const newContactModel = await models.contact.create(
      newContact, {
      include: [
        {
          model: models.meter,
          as: 'meters'
        },
        {
          model: models.contact_update,
          as: 'updates',
          include: [
            {
              model: models.appointment,
              as: 'appointment',
              include: [
                {
                  model: models.appointment_type,
                  as: 'type'
                }
              ]
            }
          ]
        },
        {
          model: models.poc,
          as: 'pocs'
        },
        {
          model: models.contact_system,
          as: 'system'
        },
        {
          model: models.gen_type,
          as: 'genType',
          attributes: ['name', 'id']
        }, {
          model: models.contact_source,
          as: 'source'
        }
      ]
    });

    await userModel.addContact(newContactModel);
    if(organizationModel) {
      await organizationModel.addContact(newContactModel);
    }
    if (newContactModel.updates && newContactModel.updates.length > 0) {
      const [updateModel] = newContactModel.updates;
      await userModel.addUpdates(updateModel);

      /// we have an opportunity
      if(updateModel.appointment){
        const appointmentModel = updateModel.appointment;
        await userModel.addAppointment(appointmentModel);
        await newContactModel.addAppointment(appointmentModel);
        await newContactModel.setOpportunity();

        try {
          await newContactModel.requestDesignForUser(userModel.id);
        }catch(e){
          console.error(e);
        }

      }
    }
    return res.status(201).json(newContactModel);
  } catch (e) {
    next(e);
  }
}



/**
 * Create a project
 */

exports.createProject = async function (req, res, next) {
  try {
    const userModel = req.userModel;
    const contactModel = req.loadedContactModel;
    const project = req.body;

    project.boardId = 1;
    project.boardId = 1;
    project.projectLaneId = 1;
    project.ownerId = userModel.id;
    project.contactId = contactModel.id;

    const newProjectModel = await models.project.create(project);
     contactModel.projectId = newProjectModel.id;
     await contactModel.save();
    return res.status(201).json(newProjectModel);
  } catch (e) {
    next(e);
  }
}


/**
 * delete a project
 */

exports.deleteProject = async function (req, res, next) {
  try {
    const userModel = req.userModel;
    const contactModel = req.loadedContactModel;
    const projectModel = await models.project.findByPk(contactModel.projectId);
    const destroyed = await projectModel.destroy();
    contactModel.projectId = null;
    await contactModel.save();
    return res.status(201).json(destroyed);
  } catch (e) {
    next(e);
  }
}


//create_update
exports.createUpdate = async function (req, res, next) {
  const userModel = req.userModel;
  const contactModel = req.loadedContactModel;
  const newUpdate = req.body;

  if (!newUpdate.toId) {
    return res.json({});
  }

  const statusUpdateModel = await models.option.findOne({where:{id:newUpdate.toId, isActive:true}});

  if(!statusUpdateModel){
    return next({message:`Status ${newUpdate.toId} not found`});
  }


  if (newUpdate.appointment && newUpdate.appointment.startDate) {

    const timezone = newUpdate.appointment.timezone;
    const appointment = newUpdate.appointment;
    const typeId = appointment.typeId;
    const appointmentTypeModel = await models.appointment_type.findOne({
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
    }
    const newAppointmentModel = await models.appointment.create(newAppointment);
    newUpdate.appointmentId = newAppointmentModel.id;

      await contactModel.addAppointment(newAppointmentModel);
      await userModel.addAppointment(newAppointmentModel);

  }

  newUpdate.contactId = contactModel.id;
  const newUpdateModel = await models.contact_update.create(newUpdate);
  await contactModel.addUpdates(newUpdateModel);
  await userModel.addUpdates(newUpdateModel);


  const to = await newUpdateModel.getTo();
  const slug = to.get('slug');


  if (slug.indexOf('appointment-set') > -1 || slug.indexOf('reschedule') > -1) {
    const attendees = [];
    const users = await contactModel.getUsers();
    for (let i = 0; i < users.length; i++) {
      attendees.push({ email: users[i].email, displayName: `${users[i].firstName} ${users[i].lastName}` });
    }
    try {
      await Services.GAPI.createCalendarEvent(userModel.id, 'primary', newUpdate.appointmentId, attendees);
    } catch (error) {
      console.error(' appointment didnt work ', error);
    }
  }



  if (slug.indexOf('drop') > -1) {
    try {
      await contactModel.setDrop();
      if (contactModel.sourceId === 5 && newUpdate.note && newUpdate.note.length > 4) {
        await contactModel.returnLead(newUpdate.note);
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (slug.indexOf('-lead') > -1) {
    await contactModel.setLead();
  }
  if (slug.indexOf('request-new-redesign') > -1) {
    await contactModel.requestDesignForUser(userModel.id);
  }
  if (slug.indexOf('appointment-set') > -1) {
    await contactModel.requestDesignForUser(userModel.id);
    await contactModel.setOpportunity();
  }

  if (slug.indexOf('close') > -1) {
    await contactModel.setClosed();
  }


  await contactModel.save();
  res.json(newUpdate);

}

exports.createClosingForm = async function (req, res, next) {

  const body = req.body;
  const contactId = req.params.contactId;
  const contactModel = req.loadedContactModel;

  if (body.id) {
    const closingFormUpdateModel = await models.closing_form.findByPk(body.id);

    await closingFormUpdateModel.update(body, {
      include: [
        {
          model: models.closing_form_update,
          as: 'updates',
          include: [{
            model: models.closing_form_update_type,
            as: 'type',
          }]
        }]
    });
    res.json(closingFormUpdateModel);
    return
  }
  const partnerProposalModels = await contactModel.getPartnerProposals({
    where: {
      selectDate: { [Op.ne]: null }
    }
  });
  const partnerModel = await partnerProposalModels[0].getPartner();
  const userModel = req.userModel;
  const closingFormModel = await models.closing_form.create(body, {
    include: [
      {
        model: models.closing_form_update,
        as: 'updates',
        include: [{
          model: models.closing_form_update_type,
          as: 'type',
        }]
      }]
  });
  await contactModel.addClosingForm(closingFormModel);
  await userModel.addClosingForm(closingFormModel);
  await partnerModel.addClosingForm(closingFormModel);
  await closingFormModel.reload();

  res.json(closingFormModel);
}

exports.createDocument = async function (req, res, next) {
  const { user, role } = req.token;
  const body = req.body;
  const contactId = req.params.contactId;
  body.contactId = contactId;
  body.userId = user;
  const newUpdate = await models.document.create(body);
  res.json(newUpdate);
}

exports.createPartnerProposal = async function (req, res, next) {
  const contactModel = req.loadedContactModel;
  const body = req.body;
  if(!body.partnerId){
    return res.json({message:'Partner id is missing'});
  }
  const newProposalModal = await models.partner_proposal.create(body);
  await contactModel.addPartnerProposals(newProposalModal)
  return res.json(newProposalModal);
}
exports.selectPartnerProposal = async function (req, res, next) {
  const contactModel = req.loadedContactModel;
  const proposalId = req.params.partnerProposalId;
  const proposals = await contactModel.getPartnerProposals({
    include: [{
      model: models.partner,
      as: 'partner'
    }]
  });
  for (let i = 0; i < proposals.length; i++) {
    const proposalModel = proposals[i];
    if (proposalModel.id === parseInt(proposalId)) {
      proposalModel.selectDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
    } else {
      proposalModel.selectDate = null;
    }
    await proposalModel.save();
  }
  res.json({ rows: proposals, count: proposals.length });
}

exports.listPartnerProposals = async function (req, res, next) {
  const contactModel = req.loadedContactModel;
  const proposals = await contactModel.getPartnerProposals({
    include: [{
      model: models.partner,
      as: 'partner'
    }]
  });
  res.json({ rows: proposals, count: proposals.length });
}

/**
 * Lenders
 */
exports.createPartnerLenderProposal = async function (req, res, next) {
  const contactModel = req.loadedContactModel;
  const body = req.body;
  const newProposalModal = await models.lender_proposal.create(body);
  await contactModel.addLenderProposals(newProposalModal);
  return res.json(newProposalModal);
}
exports.selectLenderProposal = async function (req, res, next) {
  const contactModel = req.loadedContactModel;
  const proposalId = req.params.partnerProposalId;
  const proposals = await contactModel.getLenderProposals({
    include: [{
      model: models.lender,
      as: 'lender'
    }]
  });
  for (let i = 0; i < proposals.length; i++) {
    const proposalModel = proposals[i];
    if (proposalModel.id === parseInt(proposalId)) {
      proposalModel.selectDate = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
    } else {
      proposalModel.selectDate = null;
    }
    await proposalModel.save();
  }
  res.json({ rows: proposals, count: proposals.length });
}

exports.listLenderProposals = async function (req, res, next) {
  const contactModel = req.loadedContactModel;
  const proposals = await contactModel.getLenderProposals({
    include: [{
      model: models.lender,
      as: 'lender'
    }]
  });
  res.json({ rows: proposals, count: proposals.length });
}


/**
 * Update contact
 */

exports.update = async function (req, res, next) {
  const { user, role } = req.token;
  const userModel = req.userModel;

  const contactModel = req.loadedContactModel;
  if (!contactModel) {
    return next({ message: 'Mot found' });
  }
  const body = req.body;
  const updatedModel = await models.contact.update(body, {
    include: [
      {
        model: models.contact_update, as: 'updates',
        include: [
          { model: models.appointment, as: 'appointment' }
        ]
      },
      { model: models.poc, as: 'pocs' },
      { model: models.contact_system, as: 'system' },

      {
        model: models.gen_type,
        as: 'genType',
        attributes: ['name', 'id']
      }
    ],
    where:
    {
      id: contactModel.id
    }
  });
  if (body.system) {
    body.system.contactId = contactModel.id;
    await models.contact_system.upsert(body.system);
  }

  if (body.pocs) {
    for (let i = 0; i < body.pocs.length; i++) {
      const poc = body.pocs[i];
      poc.contactId = contactModel.id;
      await models.poc.upsert(poc);
    }
  }

  if (body.updates) {
    for (let i = 0; i < body.updates.length; i++) {
      const update = body.updates[i];
      update.contactId = contactModel.id;
      update.userId = user;
      const newUpdate = await models.contact_update.create(
        update, {
        include: [
          { model: models.appointment, as: 'appointment' }
        ]
      });
      contactModel.updateId = newUpdate.id;
      const appointment = await newUpdate.getAppointment();
      if (appointment) {
        await contactModel.setOpportunity();


      } else {
        await contactModel.save();
      }
    }
  }

  await contactModel.reload();


  res.status(201).json(contactModel);

}

exports.requestNewDesign = async function (req, res, next) {

  const userModel = req.userModel;

  const contactId = req.params.contactId;
  const contactModel = await models.contact.findByPk(contactId);

  await contactModel.requestDesignForUser(userModel.id);

  res.json({ isOkay: true });
}
exports.show = async function (req, res, next) {
  const contactModel = req.loadedContactModel;
  const scope = req.query.scope;


  const [organization, meters, promotions, groups, roofType, genType, updates, documents, reps, proposals, lenderProposals] = await Promise.all([
    contactModel.getOrganization({ separate: true }),
    contactModel.getMeters({ separate: true }),
    contactModel.getPromotions(),
    contactModel.getGroups({ separate: true }),
    contactModel.getRoofType(),
    contactModel.getGenType(),
    contactModel.getUpdates({
      separate: true,
      order: [['id', 'DESC']],
      include: [{
        model: models.user,
        as: 'user',
        attributes: ['firstName', 'lastName', 'email', 'primaryPhone', 'picUrl', 'id']
      }, {
        model: models.option,
        as: 'to',
        attributes: ['name', 'id']
      }, {
        model: models.appointment,
        as: 'appointment',
        include: [{
          attributes: ['name'],
          model: models.appointment_type,
          as: 'type'
        }]
      }]
    }), contactModel.getDocuments(
      {
        separate: true,
        include: [{
          model: models.document_type,
          as: 'type'
        }]
      }), contactModel.getUsers(
        {
          separate: true,
          include: [{
            model: models.role,
            as: 'role'
          }]
        }),
    contactModel.getPartnerProposals(
      {
        separate: true,
        include: [{
          model: models.partner,
          as: 'partner'
        }]
      }),
    contactModel.getLenderProposals(
      {
        separate: true,
        include: [{
          model: models.lender,
          as: 'lender'
        }]
      })
  ]);


  contactModel.setDataValue('organization', organization);
  contactModel.setDataValue('meters', meters);
  contactModel.setDataValue('promotions', promotions);
  if (contactModel.busName) {
    contactModel.setDataValue('pocs', await contactModel.getPocs({ separate: true }));
  }
  contactModel.setDataValue('groups', groups);
  contactModel.setDataValue('genType', genType);
  contactModel.setDataValue('roofType', roofType);
  contactModel.setDataValue('updates', updates);

  contactModel.setDataValue('documents', documents);


  contactModel.setDataValue('users', reps);


  contactModel.setDataValue('partnerProposals', proposals);
  contactModel.setDataValue('lenderProposals', lenderProposals);

  return res.json(contactModel);
};

exports.listUpdates = async function (req, res) {
  const contactModel = req.loadedContactModel;
  const updates = await models.contact_update.findAll({
    order: [
      ['id', 'DESC']
    ],
    where: {
      contactId: contactModel.id
    },
    attributes: ['toId', 'createdAt', 'note'],
    include: [{
      model: models.user,
      as: 'user',
      attributes: ['firstName', 'lastName']
    }, {
      required: true,
      model: models.option,
      as: 'to',
      attributes: ['name']
    }, {
      model: models.appointment,
      as: 'appointment',
      attributes: ['fromDate', 'toDate', 'typeId', 'tzOffset', 'timezoneOffset', 'startDate', 'endDate', 'timezone'],
      include: [{
        model: models.appointment_type,
        as: 'type',
        attributes: ['name']
      }]
    }]
  });
  const newData = updates.map((update) => {
    if (update.appointment && update.appointment.tzOffset) {
      update.appointment.startDate = moment(update.appointment.fromDate).utcOffset(update.appointment.tzOffset, true).format()
      update.appointment.endDate = moment(update.appointment.toDate).utcOffset(update.appointment.tzOffset, true).format()
    }

    if (update.appointment && update.appointment.timezoneOffset) {
      update.appointment.startDate = moment(update.appointment.startDate).utcOffset(update.appointment.timezoneOffset, true).format()
      update.appointment.endDate = moment(update.appointment.endDate).utcOffset(update.appointment.timezoneOffset, true).format()
    }
    return update;
  })
  res.status(200).json(newData);
};

/**
 * Delete an contact
 */

exports.destroy = async function (req, res) {
  const id = req.params.contactId;
  let r;
  if (req.userModel) {
    r = await req.userModel.removeContact(id);
  } else {
    r = await models.contact.destroy({
      where: {
        id
      }
    })
  }
  res.json(r);
}




// contact/contactId/appointments
exports.listClosingForm = async function (req, res, next) {
  const contactId = req.params.contactId;
  const closingForm = await models.closing_form.findAndCountAll({
    order: [['id', 'DESC']],
    where: {
      contactId
    },
    include: [
      {
        model: models.closing_form_update,
        as: 'updates',
        attributes: ['createdAt', 'note'],
        include: [{
          model: models.closing_form_update_type,
          as: 'type',
          attributes: ['name']
        }]
      },
      {
        model: models.contact,
        as: 'contact',
        include: [{
          model: models.partner_proposal,
          as: 'partnerProposals',
          attributes: ['partnerId'],
          include: [{
            model: models.partner,
            as: 'partner',
            attributes: ['name']
          }]
        }]
      }
    ]
  });
  res.status(200).json(closingForm);
}



// contact/contactId/appointments
exports.listContactAppointments = async function (req, res, next) {
  const contactId = req.params.contactId;
  const contacts = await models.contact.findByPk(contactId, {
    include: [{
      model: models.appointment,
      as: 'appointments' // specifies how we want to be able to access our joined rows on the returned data
    }],
    order: [
      ['appointments', 'id', 'DESC']
    ]
  });
  res.status(200).json(contacts);
}




exports.createAdder = async function (req, res, next) {
  const loadedContactModel = req.loadedContactModel;
  const userModel = req.userModel;
  const object = req.body;

  const newModel = await models.adder.create(object);
  await loadedContactModel.addAdder(newModel);
  return res.json(newModel);
}
exports.deleteAdder = async function (req, res, next) {
  const id = req.params.adderId;
  const loadedContactModel = req.loadedContactModel;
  const userModel = req.userModel;
  const [model] = await loadedContactModel.getAdders({where:{id}});
  if(model){
    const response = await model.destroy();
    return res.json(response);
  }else{
    return res.json({message:'Not Found'});
  }
}

exports.listAdders = async function (req, res, next) {
  const contactId = req.params.contactId;
  const query = {
    where: {
      contactId: contactId,
    },
    attributes: ['id', 'name', 'value', 'quantity']
  };

  const proposals = await models.adder.findAll(query);
  res.status(200).json(proposals);
}


exports.createMeter = async function (req, res, next) {
  try {
    const body = req.body;
    const loadedContactModel = req.loadedContactModel;
    const newMeterModel = await models.meter.create(body);
    await loadedContactModel.addMeter(newMeterModel);
    await newMeterModel.reload();
    res.json(newMeterModel);
  } catch (e) {
    console.error(e);
    next(e);
  }
}
exports.updateMeter = async function (req, res, next) {
  try {
    const body = req.body;
    const loadedMeterModel = req.loadedMeterModel;
    await loadedMeterModel.update(body);
    await loadedMeterModel.reload();
    res.json(loadedMeterModel);
  } catch (e) {
    console.error(e);
    next(e);
  }
}


exports.deleteMeter = async function (req, res, next) {
  try {
    const loadedMeterModel = req.loadedMeterModel;
    const isDestroyed = await models.meter.destroy({
      where: {
        id: loadedMeterModel.id
      }
    });
    res.json(isDestroyed);
  } catch (e) {
    console.error(e);
    next(e);
  }
}

exports.listIncentives = async function (req, res, next) {

  try {
    const loadedContactModel = req.loadedContactModel;
    const state = loadedContactModel.state;
    const list = await Services.SolarIncentives.getIncentives(state)
    res.json(list);
  } catch (e) {
    console.error(e);
    next(e);
  }

}


exports.createNote = async function (req, res, next) {
  const { user, role } = req.token;
  const contactId = req.params.contactId;
  const contents = req.body.contents;
  const newNote = await models.note.create({
    userId: user,
    contents: contents
  });
  const contact = await models.contact.findByPk(contactId);
  await contact.addNote(newNote);
  await contact.save();
  const notes = await contact.getNotes({
    include: [{
      model: models.user,
      as: 'user',
      attributes: ['firstName', 'lastName'],
    }],
    order: [
      ['id', 'desc']
    ]
  });
  res.status(200).json(notes);
}

exports.createComments = async function (req, res, next) {
  const { user, role } = req.token;
  const contactId = req.params.contactId;
  const comment = req.body.comment;
  const newComment = await models.contact_comment.create({
    userId: user,
    comment: comment
  });
  const contact = await models.contact.findByPk(contactId);
  await contact.addComment(newComment);
  await contact.save();
  const comments = await contact.getComments({
    include: [{
      model: models.user,
      as: 'user',
      attributes: ['firstName', 'lastName', 'picUrl'],
      include: [{
        model: models.role,
        as: 'role',
        attributes: ['name']
      }]
    }],
    order: [
      ['id', 'desc']
    ]
  });
  res.status(200).json(comments);
}

exports.deletePromotion = async function (req, res, next) {
  const { user, role } = req.token;
  const contactId = req.params.contactId;
  const promotionId = req.params.promotionId;
  const loadedContactModel = req.loadedContactModel;
  const isDestroyed = await models.promotion.destroy({
    where: {
      contactId: contactId,
      id: promotionId
    }
  });
  res.status(200).json(isDestroyed);
}

exports.createPromotion = async function (req, res, next) {
  const { user, role } = req.token;
  const contactId = req.params.contactId;
  const loadedContactModel = req.loadedContactModel;
  const userModel = req.userModel;

  const promotion = req.body;
  const newModel = await models.promotion.create(promotion);
  await loadedContactModel.addPromotion(newModel);
  await userModel.addPromotion(newModel);

  res.status(200).json(newModel);
}

exports.listPromotions = async function (req, res, next) {
  const { user, role } = req.token;
  const contactId = req.params.contactId;
  const contact = await models.contact.findByPk(contactId);
  const loadedContactModel = req.loadedContactModel;
  const promotions = await loadedContactModel.getPromotions();

  res.status(200).json(promotions);
}



exports.listNotes = async function (req, res, next) {
  const { user, role } = req.token;
  const contactId = req.params.contactId;
  const contact = await models.contact.findByPk(contactId);
  const notes = await contact.getNotes({
    include: [{
      model: models.user,
      as: 'user',
      attributes: ['firstName', 'lastName'],
    }],
    order: [
      ['id', 'desc']
    ]
  });
  res.status(200).json(notes);
}

exports.listComments = async function (req, res, next) {
  const { user, role } = req.token;
  const contactId = req.params.contactId;
  const contact = await models.contact.findByPk(contactId);
  const comment = await contact.getComments({
    include: [{
      model: models.user,
      as: 'user',
      attributes: ['firstName', 'lastName', 'picUrl'],
      include: [{
        model: models.role,
        as: 'role',
        attributes: ['name']
      }]
    }],
    order: [
      ['id', 'desc']
    ]
  });
  res.status(200).json(comment);
}


exports.listUsers = async function (req, res, next) {
  const { isActive } = req.query;
  const contactModel = req.loadedContactModel;
  const where = {};
  if (isActive) {
    where.isActive = isActive === false ? isActive : true;
  }

  // tslint:disable-next-line:no-shadowed-variable
  const query = {
    where,
    attributes: ['firstName', 'lastName', 'id', 'lastLoginDate', 'createdAt', 'email', 'primaryPhone', 'picUrl'],
    include: [{
      model: models.role,
      as: 'role',
      attributes: ['name']
    }]
  };
  const rows = await contactModel.getUsers(query);
  const count = await contactModel.countUsers(query);

  res.status(200).json({ rows, count });
}

exports.listLenderProposals = async function (req, res, next) {
  const contactId = req.params.contactId;
  const query = {
    where: {
      contactId: contactId,
    },
    attributes: ['id', 'loanAmount', 'systemPrice', 'rate', 'months', 'systemSize'],
    include: [{
      model: models.lender,
      as: 'lender',
      attributes: ['name', 'id']
    }]
  };

  const proposals = await models.lender_proposal.findAll(query);
  res.status(200).json(proposals);
}


exports.listDocuments = async function (req, res, next) {
  const contactId = req.params.contactId;
  const where = req.params.filter;
  const query = {
    where: {
      id: contactId,
    },
    attributes: ['id'],
    include: [{
      model: models.document,
      as: 'documents',
      attributes: ['originalName', 'id', 'typeId', 'createdAt', 'location'],
      include: [{
        attributes: ['name', 'slug'],
        model: models.document_type,
        as: 'type'
      }]
    }]
  };
  const contacts = await models.contact.findOne(query);
  res.status(200).json(contacts);
}

exports.showContactClosingForm = async function (req, res, next) {
  const contactId = req.params.contactId;
  const where = req.params.filter;
  const query = {
    where: {
      id: contactId,
    },
    attributes: ['id'],
    include: [{
      model: models.document,
      as: 'documents',
      attributes: ['originalName', 'id', 'typeId', 'createdAt'],
      include: [{
        attributes: ['name', 'slug'],
        model: models.document_type,
        as: 'type'
      }]
    }]
  };

  const contacts = await models.contact.findOne(query);
  res.status(200).json(contacts);
}

exports.deletePoc = async function (req, res, next) {
  const { user, role } = req.token;

  const { contactId, pocId } = req.params;

  const contactModel = await models.contact.findByPk(contactId);
  if (!contactModel) {
    return next({ message: 'Contact does not exist' });
  }
  const pocModel = await models.poc.findOne({
    where: {
      id: pocId,
      contactId: contactId
    }
  });
  if (!pocModel) {
    return next({ message: 'poc does not exist' });
  }
  await pocModel.destroy();
  return res.json({ message: 'Deleted successful' });

}

exports.delete = async function (req, res, next) {
  const { user, role } = req.token;
  if (role.toLowerCase() !== 'admin') {
    return next({ message: 'Not authorized' });
  }
  const contactId = req.params.contactId;

  const contact = await models.contact.findByPk(contactId);
  if (!contact) {
    return next({ message: 'Contact does not exist' });
  }
  const documents = contact.getDocuments();
  if (documents && documents.length > 0) {
    for (let i = 0; i < documents.length; i++) {
      try {
        const documentModel = documents[i];
        await Services.Document.delete({
          version: documentModel.versionId,
          key: documentModel.key
        });
        await documentModel.destroy();
      } catch (e) {
        console.error(e);
      }

    }
  }
  try {
    await contact.destroy()
    res.status(200).json({ deleted: true });
  } catch (e) {
    return next(e);
  }
}

