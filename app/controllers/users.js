const admin = require("firebase-admin");

const {Op, cast, col, where, dialect} = require("sequelize");
/**
 * Module dependencies.
 */

const { wrap: async } = require('co');
const { models } = require('../../sequelize');
const moment = require('moment');
const {Services} = require("../services");
const jwt = require('jsonwebtoken');
const _ = require("lodash");

exports.self = async function (req, res, next) {
  const userModel = req.userModel;
  if(req.query.customer && !userModel.stripeCustomerId){
    return res.json({success:false});
  }

  if(req.query.customer && userModel.stripeCustomerId){
    const stripeCustomer = await userModel.getCustomer();
    return res.json(stripeCustomer);
  }

   userModel.setDataValue('managedGroups', await userModel.getManagedGroups());
  res.json(userModel.toJSON());
}
exports.updateSelf = async function (req, res, next) {
  const updateSelf = req.body;
  const userModel = req.userModel;
  await userModel.update(updateSelf);
  const firebaseUpdate = {}
  if(updateSelf.firstName){
    firebaseUpdate.displayName = `${updateSelf.firstName} ${updateSelf.lastName}`;
  }
  if(updateSelf.picUrl){
    firebaseUpdate.photoURL = updateSelf.picUrl;
  }

if(Object.keys(firebaseUpdate).length > 0) {
  await userModel.updateFirebaseUser(firebaseUpdate);
}
  await userModel.reload();
  res.json(userModel.toJSON());
}

exports.getExternalUser = async function (req, res,next) {
  const userId = req.params.userId;
  const userModel = await models.user.findByPk(userId);
  if (!userModel) {
    return next({message: 'user not found'});
  }

  return res.json({
    firstName: userModel.firstName,
    lastName:userModel.lastName
  });
}
exports.createExternalContact = async function (req, res, next) {
  const userId = req.params.userId;
  const userModel = await models.user.findByPk(userId);
  if(!userModel){
    return next({message:'Rep not found'});
  }

  try {
    const newContact = req.body;
    let sourceId;
    let sourceModel;
    if(newContact.sourceId) {
      sourceId = newContact.sourceId;
      delete newContact.sourceId;

      if (sourceId) {
        sourceModel = await models.contact_source.findByPk(sourceId);
      }
    }
      if (!sourceModel) {
        sourceModel = await models.contact_source.findOne({where: {isDefault: true}});
      }
      newContact.sourceId = sourceModel.id;

    //// newContact.user1Id = userModel.id;

    const genType = await userModel.getGenType();
    newContact.genTypeId = genType.id;
    const newContactModel = await models.contact.create(
        newContact, {
          include: [
            {model: models.poc, as:'pocs'},
            {
              model: models.gen_type,
              as: 'genType',
              attributes: ['name', 'id']
            }
          ]
        });
    if(newContact.pocs){
        for (let i = 0; i < newContact.pocs.length; i++) {
          const poc = newContact.pocs[i];
          poc.contactId = newContactModel.id;
          await models.poc.upsert(poc);
        }
    }

    if(userModel) {
      let name = ''
      let phone = '';
      if(newContact.busName) {
        name = newContactModel.busName;
        phone = newContactModel.primaryPhone || newContactModel.pocs[0].phone;
      } else {
        name = `${newContactModel.firstName} ${newContactModel.lastName}`;
        phone = newContactModel.primaryPhone;
      }//  header:'Contact Was Added to Your Account',

        try {
          await userModel.sendEmail({
            templateName:'newContact',
            parameters:{
              header:'Contact Was Added To Your Account',
              name,
              phone
            }});

        }catch(e){
          console.error('couldnt send leadform email ',e)
        }

      await userModel.addContact(newContactModel);

    }
    res.status(201).json({message:'Added', contactId:newContactModel.id});
  }catch(e){
    console.error(e);
    res.status(500).json({message:e.message});

  }
}

exports.accountReady = async function (req, res, next) {
  const fid = req.params.fid;
  const targetUserJSON = await models.user.findOne({where:{fid},plain:true});
  if(!targetUserJSON){
    res.status(500).json({isReady:false})
  }else{
    res.status(200).json({isReady:true})
  }
}
exports.migrate = async function (req, res, next) {
  const userId = req.params.userId;
  const targetUserModel = await models.user.findByPk(userId);
  if(!targetUserModel.fid){
   // await targetUserModel.syncFirebaseUser();
    res.status(200).json({isMigrated:true})
  }else{
    res.status(200).json({isMigrated:true})
  }
}

exports.loginAs = async function (req, res, next) {
  const userId = req.params.userId;
  try {
    const targetUserModel = await models.user.findByPk(userId);
    let token;
    try{
      console.log('CREATING FIRENASE USER')

    }catch(e){
      console.log('error')

      console.error(e);
    }

    setTimeout(async(m)=> {

     // await targetUserModel.syncFirebaseClaims();
      token = await targetUserModel.getFirebaseAuthToken();
      return res.status(200).send({token});
    },8000)
  }
  catch (error) {
    console.error(error);
    next(error);
  }

}

exports.list = async function (req, res) {
  let {roleIds, isActive = true, q, limit = 500, offset = 0, name, organizationFilter, scope = "basic"} = req.query
  const where = {
    isActive,
  }
  if(q && q.length > 2){
    where[Op.or] = Services.Search.query(q);
  }

  if(name && name.length > 0){
    where[Op.or] = Services.Search.repName(name);
  }
  console.log('where ',where)

  const query = {
    order:[['id','DESC']],
    limit,
    offset,
    where,
    include:[{
      model:models.user_group,
      as:'user_group'
    },{
      required:true,
      attributes:['name','id'],
      model:models.role,
      as:'role',
    },{
      required:false,
      model:models.organization,
      attributes:['name','id'],
      as:'organization',
    }]}


  if(roleIds){
    const roleInclude = (_.find(query.include, { as: 'role' }));
    roleInclude.required = true;
    roleInclude.where = {
      id: roleIds.toString().indexOf(',') > -1 ? roleIds.split(',') : [roleIds]
    }
  }

  const userModel = req.userModel;
  const isAdmin = await userModel.isAdmin();

  if(organizationFilter){
    const organizationInclude = (_.find(query.include, { as: 'organization' }));
    organizationInclude.required = true;
    organizationInclude.where = {
      id: organizationFilter.toString().indexOf(',') > -1 ? organizationFilter.split(',') : [organizationFilter]
    }
  }
  if(!isAdmin){
    const organizationInclude = (_.find(query.include, { as: 'organization' }));
    organizationInclude.required = true;
    organizationInclude.where = {
      id: userModel.organizationId
    }

  }

  console.log('users ',query)
  console.log('users ',query.where)


  // query.order.unshift([queryFilter.sortObject.column, queryFilter.sortObject.direction]);
  const users = await models.user.findAndCountAll(query);
  res.json(users);
}
exports.listAppointments = async function(req,res){
  const userId = req.params.userId;
  const from = req.query.from;
  const to = req.query.to;
  let ww = {};
  //where.userId = userModel.id;
  if(from && to){
    ww ={
      [Op.and]: [
        where(cast(col('startDate'), 'DATETIME'), '>=', from),
        where(cast(col('endDate'), 'DATETIME'), '<=', to)
      ]
    }
  }

  const userModel = await models.user.findByPk(userId);
  const contacts = await userModel.getContacts();
  const contactIds = contacts.map((c)=>c.id);
  ww.contactId =  {
    [Op.in]: contactIds
  }
  //  const userId = req.query.userId;

  const data = await models.appointment.findAll( {
    isActive: true,
    attributes:[
      'startDate',
        'fromDate','endDate','toDate','typeId','tzOffset','timezone','timezoneOffset'],
    where: ww,
    include:[
      {
        model:models.contact,
        as:'contact',
        attributes:['email','primaryPhone','firstName','lastName','id','name','busName']
      },
      {
        model:models.appointment_type,
        as:'type',
        attributes:['name']
      }
    ],
    order: [['startDate','ASC']]
  });
  const newData = data.map((appt)=>{
    if(appt && appt.tzOffset){
      appt.startDate = moment(appt.fromDate).utcOffset(appt.tzOffset,true).format()
      appt.endDate = moment(appt.toDate).utcOffset(appt.tzOffset,true).format()
    }
    if (appt.startDate && appt.timezoneOffset) {
      appt.startDate = moment(appt.startDate).utcOffset(appt.timezoneOffset,true).format()
      appt.endDate = moment(appt.endDate).utcOffset(appt.timezoneOffset,true).format()
    }
    return appt;
  })
  res.json(newData);
}
exports.listGroups = async function (req, res) {
  const userModel = req.loadedUserModel;
  const {isManager, isActive = true } = req.query;

  if(!isManager){
     const userGroups = await userModel.getGroups({
       include: [
         {
           as: "type",
           attributes: ['id','name'],
           model: models.user_group_type,
         }
       ],
       order: [
         ['id', 'DESC']
       ],
       where:{
       isActive,
       }});
    return res.json({rows:userGroups});
  }
  if(isManager === true){
    let managed = await userModel.getManagedGroups({
      include: [
        {
          as: "type",
          attributes: ['id','name'],
          model: models.user_group_type,
        }
      ],
      order: [
        ['id', 'DESC']
      ],
      where:{
        isActive,
      }});
    return res.json({rows:managed});
  }
  res.json({rows:[]});
}

exports.show = async function (req, res) {
  const loadedUserModel = req.loadedUserModel;
  if(req.query.customer && !loadedUserModel.stripeCustomerId){
    return res.json({success:false});
  }
  if(req.query.customer && loadedUserModel.stripeCustomerId){
    const stripeCustomer = await loadedUserModel.getCustomer();
    return res.json(stripeCustomer);
  }

  loadedUserModel.setDataValue('managedGroups', await loadedUserModel.getManagedGroups());
  loadedUserModel.setDataValue('organization', await loadedUserModel.getOrganization({
    attributes:['name','id']
  }));
  res.json(loadedUserModel);
}

exports.create = async function(req, res, next) {
  try {
    await models.user.create(req.body);
    res.status(201).end();
  } catch (err) {
    next(err);
  }
}

exports.count = async function (req, res,next) {
  const count = await models.user.count();
  res.json({
    count: count,
  })
}

exports.patchContact = async function(req, res,next) {
  const loadedUserModel = req.loadedUserModel;
  try {
    const addContactId = req.body.add;
    const removeContactId = req.body.remove;
    if(addContactId) {
      const contactModel = await models.contact.findByPk(addContactId);
      const latestAppointments = await models.appointment.findAll({
        order: [ [ 'createdAt', 'DESC' ]],
        limit: 1,
        where:{
          contactId:contactModel.id
        }
      });
      const latestAppointment = latestAppointments[0];

      /// add organization
   //   contactModel.organizationId = organizationModel.id;
      await contactModel.save();
      await loadedUserModel.addContact(contactModel);

      try {
        const name = contactModel.busName ? contactModel.busName  : `${contactModel.firstName} ${contactModel.lastName}`;
        await loadedUserModel.sendEmail({
          templateName:'newContact',
          parameters:{
            header:'Contact Was Assigned to You',
            name,
            phone: `${contactModel.primaryPhone}`
        }});
      }catch(e){
        console.error(e);
        console.error('send email')
      }

      try {
        const name = contactModel.busName ? contactModel.busName  : `${contactModel.firstName} ${contactModel.lastName}`;
        const message =`New Contact (${name}) was assigned to you. Please login to G3.app for more details.`;
        await loadedUserModel.sendSMS(message);
      }catch(e){
        console.error(e);
        console.error('send email')
      }
      if(latestAppointment) {
        const attendees = [];
        const users = await contactModel.getUsers();
        for (let i = 0; i < users.length; i++) {
          attendees.push({email: users[i].email, displayName: `${users[i].firstName} ${users[i].lastName}`});
        }
        try {
          await Services.GAPI.createCalendarEvent(loadedUserModel, 'primary', latestAppointment.id, attendees);
        } catch (error) {
          console.error(' appointment didnt work ', error);
        }
      }

      return res.status(201).json({isOkay:true})
    }

    if(removeContactId) {

      const contactModel = await models.contact.findByPk(removeContactId);
      const latestAppointments = await models.appointment.findAll({
        order: [ [ 'createdAt', 'DESC' ]],
        limit: 1,
        where:{
          contactId:contactModel.id
        }
      });
      const latestAppointment = latestAppointments[0];

       await loadedUserModel.removeContact(contactModel);

      if(latestAppointment) {
        const attendees = [];
        const users = await contactModel.getUsers();
        for (let i = 0; i < users.length; i++) {
          attendees.push({email: users[i].email, displayName: `${users[i].firstName} ${users[i].lastName}`});
        }
        try {
          await Services.GAPI.createCalendarEvent(loadedUserModel, 'primary', latestAppointment.id, attendees);
        } catch (error) {
          console.error(' appointment didnt work ', error);
        }

      }
      return res.status(201).json({isOkay:true})

    }

  } catch (e) {
    console.error(e.message);
    next(e);
  }
}

exports.update = async function(req, res,next) {
  const userModel = req.userModel;
  const loadedUserModel = req.loadedUserModel;
  const id = req.params.userId;
  const body = req.body;

  if(!userModel.isAdmin() && userModel.id !== parseInt(id)){
    return res.json({message:'Not authorized'});
  }

  try {
    await loadedUserModel.update(body);
    if(body.organization){
      await loadedUserModel.setOrganization(body.organization.id)
    }

    const firebaseUpdate = {}
    if(body.firstName){
      firebaseUpdate.displayName = `${body.firstName} ${body.lastName}`;
    }
    if(body.picUrl){
      firebaseUpdate.photoURL = body.picUrl;
    }
    if(body.isActive === false || body.isActive === true){
      firebaseUpdate.disabled = body.isActive ? false : true;
    }

    if(Object.keys(firebaseUpdate).length > 0) {
      await loadedUserModel.updateFirebaseUser(firebaseUpdate);
    }

      res.status(201).json();
  } catch (e) {
    next(e);
  }
}
exports.logout = function(req, res) {
  req.logout();
  res.redirect('/login');
};
exports.listDocuments = async function(req, res,next) {
  const id = req.params.userId;
  const where = req.params.filter;
  const query = {
    where:{
      id:id,
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
  const obj = await models.user.findOne(query);
  res.status(200).json(obj);
}
exports.listProjects = async function(req, res,next) {
  const {user, role} = req.token;
  const id = req.params.userId;
  if(role !== 'admin' && id != user){
    return next({message:'Not authorized'});
  }
  const i = [{
    model: models.project,
    as: 'projects',
    attributes:['createdAt','id'],
    order: [
      ['id', 'DESC']
    ],
    include:[{
      attributes:['note','createdAt'],
      model: models.project_update,
      as:'update',
      include: [{
        model: models.project_update_type,
        as: 'to',
        attributes:['name','id']
      }]
    },{
      model:models.user,
      attributes:['firstName','partnerId'],
      as:'partnerUser',
      include:[{
        attributes:['name'],
        model: models.partner,
        as:'partner'
      }]
    },{
      as:'contact',
      model:models.contact,
      attributes:[
        'primaryPhone',
        'firstName',
        'lastName',
        'address1',
        'city','state','postalCode'
      ]
    }]
  }];
  const u = await models.user.findByPk(user,{attributes:['id'],include:i});
  res.json(u);
}
exports.listIntegrations = async function(req, res,next) {
  const {user, role} = req.token;
  const id = req.params.userId;
  const i = [{
    attributes:['name','isActive','createdAt'],
    model:models.integration,
    as:'integrations'
  }]
  const u = await models.user.findByPk(id,{attributes:['id'],include:i});
  res.json(u);
}
exports.listApiKeys = async function(req, res,next) {
  const {user, role} = req.token;
  const id = req.params.userId;
  const i = [{
    attributes:['token','isActive','createdAt'],
    model:models.api_key,
    as:'api_keys'
  }]
  const u = await models.user.findByPk(id,{attributes:['id'],include:i});
  res.json(u);
}

exports.listContacts = async function(req, res,next) {
  const {propertyTypeId, isActive = true,q, statusFilter, stageId} = req.query;
  const loadedUserModel = req.loadedUserModel;

  const where = {
    isActive
  }

  if(q && q.length > 1){
    where[Op.or] = Services.Search.query(q);
  }

  const query = {
    subQuery: false,
    where,
    attributes: [ 'isActive', 'id', 'leadDate', 'opportunityDate', 'firstName', 'lastName', 'primaryPhone', 'email', 'address1', 'city', 'state', 'postalCode', 'busName', 'name'],
    include: [
      {
        model: models.user,
        as: 'users',
        attributes: ['firstName', 'lastName', 'picUrl'],
        include: [{
          model: models.role,
          as: 'role',
          attributes: ['name']
        }]
      },
      {
        required: false,
        separate:false,
        model: models.contact_update,
        order:[['id','DESC']],
        as: 'updates',
        limit: 1,
        attributes: ['id', 'note', 'createdAt'],
        include: [{
          required: false,
          model: models.option,
          as: 'to',
          attributes: ['name', 'id', 'slug']
        }
        ]
      },
      {
        required: false,
        model: models.contact_stage,
        as: 'stage',
        attributes: ['name','id'],
      },
      {
        required: false,
        model: models.property_type,
        as: 'propertyType',
        attributes: ['name','id'],
      }]
  };

  if(stageId) {
    const stageInclude = (_.find(query.include, { as: 'stage' }));
    stageInclude.required = true;
    stageInclude.where = {
      id: stageId
    }
  }
  if(propertyTypeId) {
    const propertyTypeInclude = (_.find(query.include, { as: 'propertyType' }));
    propertyTypeInclude.required = true;
    propertyTypeInclude.where = {
      id: propertyTypeId
    }
  }

  if(statusFilter) {
    const updatesInclude = (_.find(query.include, { as: 'updates' }));
    updatesInclude.required = true;
    updatesInclude.include[0].required = true;
    updatesInclude.include[0].where = {
      [Op.or]: Services.Search.statusFilter(statusFilter)
    }
  }

  const rows = await loadedUserModel.getContacts(query);
  const count = await loadedUserModel.countContacts(query);

  res.status(200).json({rows, count });
}

exports.createContact = async function(req, res,next) {
  const {user, role} = req.token;
  const userId = req.params.userId;
  const userModel = await models.user.findByPk(userId);

  try {
    const newContact = req.body;
    //// newContact.user1Id = userModel.id;

    const genType = await userModel.getGenType();
    newContact.genTypeId = genType.id;

    if(newContact.updates){
      newContact.updates.forEach((u)=>{
        u.userId = user;
      });
    }
    const newContactModel = await models.contact.create(
        newContact, {
          include: [
            {
              model: models.contact_system,
              as: 'system'
            },
            {model: models.contact_update, as:'updates',
            include:[
              { model: models.appointment, as:'appointment' }
            ]
            },
            {model: models.poc, as:'pocs'},
            {
              model: models.gen_type,
              as: 'genType',
              attributes: ['name', 'id']
            }
          ]
        });
    if(newContactModel){
      const updates = await newContactModel.getUpdates();
      if(updates && updates.length > 0) {
        newContactModel.updateId = updates[0].id;
        const appointmentModel = await updates[0].getAppointment();
        if (appointmentModel) {
          appointmentModel.userId = user;
          appointmentModel.contactId = newContactModel.id;
          await appointmentModel.save();
          await newContactModel.setOpportunity();

          const token = jwt.sign({user: userModel.id, sub: userModel.id, role: 'readOnly'}, process.env.JWT_TOKEN, {
            expiresIn: '1w'
          });
          const redirectUrl = `${process.env.FRONTEND_URL}/sale/contacts/${newContactModel.id}/proposals`;
          const finalUrl = `${process.env.FRONTEND_URL}/#token=${token}&redirect=${redirectUrl}`;
          const name = newContactModel.busName ? `*Business:* ${newContactModel.busName}` : `*Homeowner:*  ${newContactModel.firstName} ${newContactModel.lastName}`;
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
      }

      if(userModel) {
      await userModel.addContact(newContactModel);

      try {
        await models.contact_event.create({
          contactId: newContactModel.id,
          userId: userModel.id,
          typeId: 1
        });
      }catch(e){
        console.error('FAILED TO CREATE EVENT ',e.message)
      }

    }
    res.status(201).json(newContactModel);
  }catch(e){
    console.error(e);
  }
}
exports.listClosingForms = async function(req, res,next) {
  const {user, role} = req.token;
  const userId = req.params.userId;
  if(role !== 'admin' && parseInt(userId) !== parseInt(userId)){
    return next({message:'not authorized'});
  }

  const closingforms = await models.closing_form.findAll({
    where:{
      submittedById:userId
    },
    include: [
      {
        model: models.contact,
        as: 'contact',
        include:[{
          model: models.contact_stage,
          as: 'stage'
        },{
          model: models.lender_proposal,
          as:'lenderProposals',
          attributes:['months','years','rate','loanAmount','systemPrice','isCash', 'cashAmount','id','ppwNet','ppwGross','systemSize'],
          include:[{
            model: models.lender,
            as:'lender',
            attributes:['name'],
          }]
        },{
          model: models.promotion,
          as: 'promotions'
        },{
          model: models.gen_type,
          as: 'genType',
          attributes:['name']
        }, {
          model: models.partner_proposal,
          as: 'partnerProposals',
          attributes:['partnerId','url'],
          include:[ {
            model: models.partner,
            as: 'partner',
            attributes:['name']
          }]
        },{
          model: models.user,
          as: 'users',
          attributes:['firstName','lastName','roleId'],
          include:[ {
            model: models.role,
            as: 'role',
            attributes:['name']
          }]
        }]
      },
      {
        model: models.closing_form_status,
        as: 'status'
      }
    ],
    order: [
      ['id', 'DESC']
    ]
  });

  res.json({
    rows:closingforms
  })
}
