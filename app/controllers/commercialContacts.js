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



exports.list = async function (req, res,next) {
  const limit = req.query.limit || 2000;
  const offset = req.query.offset || 0;
  const order = req.query.order || 'DESC';

  const {user, role} = req.token;
  if(role.toLowerCase() !== 'admin'){
    return next({message:'Not authorized'});
  }



  let contactType = req.query.stage; /// 'lead, opportunity, contact
  let assignmentType = req.query.assignmentType; /// 'assigned, unassigned'
  if(assignmentType && assignmentType ==='unassigned'){
    const groupId = 25;
    const qq = `
    SELECT
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
    /*
    const groupId = 25;
    const qq = `
    Select * from (
SELECT contacts.id as id,
       contact_types.slug ,
       contacts.firstName,
       contacts.lastName,
       contacts.primaryPhone,
       contact_updates.createdAt
  FROM contacts, contact_types, contact_updates, users
 WHERE     contacts.typeId = contact_types.id AND contacts.isActive=1
 AND contacts.id=contact_updates.contactid
       AND contact_types.slug = 'opportunity'
       AND contact_updates.userId  IN
              (SELECT users.id
                 FROM  roles, users, user_group_user
                WHERE users.roleid = roles.id
                AND user_group_user.userId=users.id
                AND user_group_user.userGroupId=${groupId}
                      AND roles.slug = 'setter' group by users.id  having count(users.id)=1)
                      order by contact_updates.createdAt DESC )a group by id,slug,firstName,lastName, a.createdAt
    `;

     */
    let queryResults = await sequalize.query(qq, {
      raw: true,
      type: QueryTypes.SELECT,
    });
    res.json(queryResults);
    return;

  }


  const contactTypeModel = await models.contact_type.findOne({
    where:{
      slug:contactType
    }
  });
  if(!contactTypeModel){
    return next({message:`${contactType} not found`});
  }

  let obj_array;

  const where = {
    'typeId': contactTypeModel.id
  }


  obj_array = await models.contact.findAll({
    isActive: true,
    offset: offset,
    limit: limit,
    order: [
      ['id', order]
    ],
    attributes:[
        'isActive',
        'createdAt',
        'id',
        'name',
        'firstName',
      'lastName',
      'leadDate',
      'opportunityDate',
      'updateId','primaryPhone','email','city','state','postalCode','address1'],
    include:[{
      attributes:['note','createdAt'],
      model: models.contact_update,
      as:'update',
      include: [{
        model: models.option,
        as: 'to',
        attributes:['name','id']
      }]
    },{
      model:models.user,
      as:'users',
      attributes:['id','firstName','lastName','picUrl','email','primaryPhone']
    }
    ],
    where: where,
    order: [
      ['id', 'DESC'],
      ['leadDate', 'ASC'],
    ]
  });






  res.json( obj_array);
}


exports.listTypes = async function (req, res) {
  const data = await models.contact_type.findAll({
    where: {
      isActive: true
    }
  });
  res.json(data);
}
exports.listSources = async function (req, res) {
  const data = await models.contact_source.findAll({
    where: {
      isActive: true
    }
  });
  res.json(data);
}
exports.listGenTypes = async function (req, res) {
  const data = await models.gen_type.findAll({
    where: {
      isActive: true
    }
  });
  res.json(data);
}

exports.count = async function (req, res) {
  const count = await models.contact.count();
  res.json({
    count: count,
  })
}



/**
 * Create an contact
 */

exports.create = async function(req, res,next) {
  try {
    const {user, role} = req.token;

    const userModel = await models.user.findByPk(user,{where:{isActive:true}});
    const newContact = req.body;
    if(!userModel){
      return next({message:'User not active'});
    }
   //// newContact.user1Id = userModel.id;

    if(newContact.id){
      const foundContact = await models.contact.findByPk(newContact.id);
      if(userModel) {
        await userModel.addContact(newContactModel);
      }
      return res.status(201).json(foundContact);
    }

    const genType = await userModel.getGenType();
    newContact.genTypeId = genType.id;
    const newContactModel = await models.contact.create(
        newContact, {
          include: [
            {
              model: models.gen_type,
              as: 'genType',
              attributes: ['name', 'id']
            }, {
              model: models.user,
              as: 'user1',
              attributes: ['firstName', 'lastName', 'picUrl', 'id'],
              include: [
                {
                  model: models.role,
                  as: 'role',
                  attributes: ['name', 'slug'],
                }
              ]
            },
          ]
        });

    if(userModel) {
      await userModel.addContact(newContactModel);
    }
    res.status(201).json(newContactModel);
  }catch(e){
    console.error(e);
  }
}


//create_update
exports.createUpdate = async function(req, res,next) {
  const {user, role} = req.token;
  const body  = req.body;
  const contactId = req.params.contactId;
  body.contactId = contactId;
  body.userId = user;
  const newUpdate = await models.change.create(body);
  res.json(newUpdate);
}
/**
 * Update contact
 */

exports.update = async function(req, res,next) {
  const contactModel = req.loadedContactModel;
  if(!contactModel){
    return next({message:'contact not found'});
  }
  const body  = req.body;
 await models.contact.update(body,{
    returning: true,
    plain: true,
    where:
        {
          id:contactModel.id
        }});
  await contactModel.reload();

  res.status(201).json(contactModel);


};


exports.show = async function (req, res, next) {


  const {user, role} = req.token;
  const contactId = req.params.contactId;
  const contactModel = await models.contact.findByPk( contactId,{
    order:[
      [ 'id', 'DESC'],
      [ {model:models.note, as:'notes'}, 'id', 'DESC' ],
    ],
    include:[{
      model: models.note,
      as:'notes',
      include:[{
        model: models.user,
        as:'user',
        attributes:['firstName','lastName'],
      }]
    },{
      model: models.document,
      as:'documents',
      include:[{
        model: models.document_type,
        as:'type',
        attributes:['name','slug'],
      }]
    },{
      model: models.lender_proposal,
      as:'lenderProposal',
      attributes:['lenderId','months','years','rate','loanAmount','systemPrice','isCash', 'cashAmount','id','ppwNet','ppwGross','systemSize'],
      include:[{
        model: models.lender,
        as:'lender',
        attributes:['id','name'],
      }]
    },{
      model: models.partner_proposal,
      as:'partnerProposals',
      attributes:['url'],
      include:[{
        model: models.partner,
        as:'partner',
        attributes:['id','name','userId'],
      }]
    },{
      model: models.contact_update,
      as:'update',
      attributes:['note','createdAt'],
      include: [{
        model: models.option,
        as: 'from',
        attributes:['name','id']

      },{
        model: models.user,
        as: 'user',
        attributes:['id','firstName','lastName']
      }, {
        model: models.option,
        as: 'to',
        attributes:['name','id','slug'],
      }]
    },{
      model:models.gen_type,
      as:'genType',
      attributes:['name','slug','id']
    },{
      model:models.roof_type,
      as:'roofType',
      attributes:['name']
    },{
      model:models.user,
      as:'users',
      attributes:['id','firstName','lastName','picUrl','primaryPhone','email'],
      include: [{
        model: models.role,
        as: 'role',
        attributes:['name','slug']

      }],
    },
      {
        model:models.contact_source,
        as:'source',
      },{
        model:models.contact_type,
        as:'type',
      },{
        model:models.hoa,
        as:'hoa',
      },
      {model: models.appointment, include: ['user'], as:'appointments'},
    ]});
  if(!contactModel){
    return next({message:'Homeowner not found'});
  }
  if(!contactModel.users){
    return next({message:'No users assigned'})
  }
  const userIds = contactModel.users.map( u => parseFloat(u.id));

  if(role !== 'admin' && userIds.indexOf(parseFloat(user)) === -1){
    return next({message:'Not authorized to view this page', code:401})
  }


  res.status(200).json(contactModel);
};

exports.listUpdates = async function (req, res) {
  const contactModel =  req.loadedContactModel;
  const updates = await models.contact_update.findAll({
    order: [
      ['id', 'DESC']
    ],
    where:{
      contactId: contactModel.id
    },
    attributes:['toId','createdAt','note'],
    include:[{
      model:models.user,
      as: 'user',
      attributes:['firstName','lastName']
    },{
      model:models.option,
      as: 'to',
      attributes:['name']
    },{
      model:models.appointment,
      as: 'appointment',
      attributes:['fromDate','toDate','typeId','tzOffset','timezoneOffset','startDate','endDate','timezone'],
      include:[{
        model:models.appointment_type,
        as: 'type',
        attributes:['name']
      }]
    }]
  });
  const newData = updates.map((update)=>{
    if(update.appointment && update.appointment.tzOffset){
      update.appointment.startDate = moment(update.appointment.fromDate).utcOffset(update.appointment.tzOffset,true).format()
      update.appointment.endDate = moment(update.appointment.toDate).utcOffset(update.appointment.tzOffset,true).format()
    }
    if(update.appointment && update.appointment.timezoneOffset){
      update.appointment.startDate = moment(update.appointment.startDate).utcOffset(update.appointment.timezoneOffset).format()
      update.appointment.endDate = moment(update.appointment.endDate).utcOffset(update.appointment.timezoneOffset).format()
    }
    return update;
  })
  res.status(200).json(newData);
};

/**
 * Delete an contact
 */

exports.destroy = async function(req, res) {
  const id = req.params.contactId;
  let r;
  if(req.userModel){
    r = await req.userModel.removeContact(id);
  }else {
     r = await models.contact.destroy({
      where:{
        id
      }
    })
  }
  res.json(r);
}




// contact/contactId/appointments
exports.getClosingForm = async function(req, res,next) {
  const contactId = req.params.contactId;
  const closingForm = await models.closing_form.findOne( {where:{
      contactId
    },
    include: [
      {
        model: models.closing_form_update,
        as: 'update',
        attributes:['toId','createdAt','note'],
        include:[ {
          model: models.closing_form_update_type,
          as: 'to',
          attributes: ['name']
        }]
      },
      {
        model: models.contact,
        as: 'contact',
        attributes: ['partnerProposalId'],
        include:[ {
          model: models.partner_proposal,
          as: 'partnerProposals',
          attributes:['partnerId'],
          include:[ {
            model: models.partner,
            as: 'partner',
            attributes:['name']
          }]
        }]
      }
    ]
  });
  res.status(200).json(closingForm);
}



// contact/contactId/appointments
exports.listContactAppointments = async function(req, res,next) {
  const contactId = req.params.contactId;
  const contacts = await models.contact.findByPk( contactId,{include: [{
      model: models.appointment,
      as: 'appointments' // specifies how we want to be able to access our joined rows on the returned data
    }],
    order: [
    [ 'appointments', 'id', 'DESC' ]
  ]});
  res.status(200).json(contacts);
}





exports.listAdders = async function(req, res,next) {
  const contactId = req.params.contactId;
  const query = {
    where:{
      contactId:contactId,
    },
    attributes: ['id','name','value','quantity']
  };

  const proposals = await models.adder.findAll(query);
  res.status(200).json(proposals);
}



exports.listIncentives = async function(req, res,next) {
  const contactId = req.params.contactId;
  const query = {
    where:{
      contactId:contactId,
    },
    attributes: ['id','name','description'],
    include: [{
      model: models.incentive_type,
      as: 'type',
      attributes: ['name','id']
    }]};

  const proposals = await models.incentive.findAll(query);
  res.status(200).json(proposals);
}


exports.createNote = async function(req, res,next) {
  const {user, role} = req.token;
  const contactId = req.params.contactId;
  const contents = req.body.contents;
  const newNote = await models.note.create({
    userId:user,
    contents:contents
  });
  const contact = await models.contact.findByPk(contactId);
  await contact.addNote(newNote);
  await contact.save();
  const notes = await contact.getNotes({
    include:[{
      model: models.user,
      as:'user',
      attributes:['firstName','lastName'],
    }],
    order: [
      ['id', 'desc']
    ]
  });
  res.status(200).json(notes);
}
exports.listNotes = async function(req, res,next) {
  const {user, role} = req.token;
  const contactId = req.params.contactId;
  const contact = await models.contact.findByPk(contactId);
  const notes = await contact.getNotes({
    include:[{
      model: models.user,
      as:'user',
      attributes:['firstName','lastName'],
    }],
    order: [
      ['id', 'desc']
    ]
  });
  res.status(200).json(notes);
}



exports.listPartnerProposals = async function(req, res,next) {
  const contactId = req.params.contactId;
  const query = {
    where:{
      contactId:contactId,
    },
    attributes: ['id','url','createdAt'],
    include: [{
      model: models.partner,
      as: 'partner',
      attributes: ['name','id']
    }]};

  const proposals = await models.partner_proposal.findAll(query);
  res.status(200).json(proposals);
}

exports.listUsers = async function(req, res,next) {
  const contactId = req.params.contactId;
  const query = {
    attributes: ['id'],
    include: [{
      model: models.user,
      as: 'users',
      attributes: ['firstName','lastName','id','lastLoginDate','createdAt','email','primaryPhone'],
      include: [{
        model: models.role,
        as: 'role',
        attributes: ['name']
      }]
    }]};

  const obj = await models.contact.findByPk(contactId,query);
  res.status(200).json(obj);
}

exports.listLenderProposals = async function(req, res,next) {
  const contactId = req.params.contactId;
  const query = {
    where:{
      contactId:contactId,
    },
    attributes: ['id','loanAmount','systemPrice','rate','months','systemSize'],
    include: [{
      model: models.lender,
      as: 'lender',
      attributes: ['name','id']
    }]};

  const proposals = await models.lender_proposal.findAll(query);
  res.status(200).json(proposals);
}


exports.listDocuments = async function(req, res,next) {
  const contactId = req.params.contactId;
  const where = req.params.filter;
  const query = {
    where:{
      id:contactId,
    },
    attributes: ['id'],
    include: [{
      model: models.document,
      as: 'documents',
      attributes: ['originalName','id','typeId','createdAt'],
      include:[{
        attributes: ['name','slug'],
        model: models.document_type,
        as: 'type'
      }]
    }]};
  const contacts = await models.contact.findOne(query);
  res.status(200).json(contacts);
}

exports.showContactClosingForm = async function (req, res, next) {
  const contactId = req.params.contactId;
  const where = req.params.filter;
  const query = {
    where:{
      id:contactId,
    },
    attributes: ['id'],
    include: [{
      model: models.document,
      as: 'documents',
      attributes: ['originalName','id','typeId','createdAt'],
      include:[{
        attributes: ['name','slug'],
        model: models.document_type,
        as: 'type'
      }]
    }]};

  const contacts = await models.contact.findOne(query);
  res.status(200).json(contacts);
}


exports.delete = async function (req, res, next) {
  const {user, role} = req.token;
  if(role.toLowerCase() !== 'admin'){
    return next({message:'Not authorized'});
  }
  const contactId = req.params.contactId;

  const contact = await models.contact.findByPk(contactId);
  if(!contact){
    return next({message:'Contact does not exist'});
  }
  const documents = contact.getDocuments();
  if(documents && documents.length > 0){
    for(let i = 0; i < documents.length; i++){
      try {
        const documentModel = documents[i];
        await Services.Document.delete({
          version: documentModel.versionId,
          key: documentModel.key
        });
        await documentModel.destroy();
      }catch(e){
        console.error(e);
      }

    }
  }
  try {
    await contact.destroy()
    res.status(200).json({deleted: true});
  }catch(e){
    return next(e);
  }
}

