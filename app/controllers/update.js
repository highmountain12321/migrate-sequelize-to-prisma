'use strict';

/**
 * Module dependencies.
 */

const { wrap: async } = require('co');
const only = require('only');
const moment = require('moment');
const assign = Object.assign;
const _ = require('lodash');
const { models } = require('../../sequelize');
const { Services } = require('../services');
const jwt = require('jsonwebtoken');


exports.list = async function(req, res,next) {
    const updates = await prisma.contactUpdate.findMany();
    res.json(updates);
}
exports.create = async(req, res,next)=> {
    const {user, role} = req.token;
    const newUpdate  = req.body;
    const userModel = await prisma.user.findFirst({
        where: {
            id: user,
            isActive: true
        }
    });
    if(!userModel){
        // return next({message:'User not active'});
        return res.status(400).send({message: 'User not active'})
    }
    if(!newUpdate.toId){
        return res.json({});
    }
    newUpdate.userId = user;
    if(newUpdate.appointment && newUpdate.appointment.startDate){
        const timezone = newUpdate.appointment.timezone;
        const appointment = newUpdate.appointment;
        const typeId = appointment.typeId;
        const appointmentTypeModel = await prisma.appointment_type.findOne({
            where: {
                id:typeId,
                isActive:true
            }
        });

      const newAppointment = {
          timezoneOffset: timezone.timeValue,
          timezone: timezone,
          startDate: appointment.startDate,
          endDate: moment(appointment.startDate).add(appointmentTypeModel.add,'minutes').format("YYYY-MM-DD HH:mm:ss"),
          typeId:appointmentTypeModel.id,
          contactId: newUpdate.contactId,
          userId:user
      }
      const newAppointmentModel = await prisma.appointment.create({data: newAppointment});

      newUpdate.appointmentId = newAppointmentModel.id;
    }

    const newUpdateModel = await prisma.contact_update.create({data: newUpdate});
    const to = await newUpdateModel.getTo();
    const slug = to.get('slug');


   const contactModel = await prisma.contact.findUnique({where: {id: newUpdateModel.contactId}});
    if(slug.indexOf('appointment-set') > -1 || slug.indexOf('reschedule') > -1){
       const attendees =[];
       const users = contactModel.getUsers();
       for(let i = 0; i < users.length; i++){
           attendees.push({email: users[i].email, displayName: `${users[i].firstName} ${users[i].lastName}`});
       }
       try {
           await Services.GAPI.createCalendarEvent(user, 'primary', newUpdate.appointmentId, attendees);
       }catch(error){
           console.error(' appointment didnt work ',error);
       }
   }





    const currentDate =  moment().utc(true).format("YYYY-MM-DD HH:mm:ss");


    contactModel.set('updateId', newUpdateModel.id);
    contactModel.set('lastUpdateDate', currentDate);

    if(slug.indexOf('drop') > -1){
        try {
            if(contactModel.sourceId === 5 && newUpdate.note && newUpdate.note.length > 4){
                console.log('RETURNING '+contactModel.email + ' '+newUpdate.note);
                await Services.Slack.returnLead({
                    "blocks": [
                        {
                            "type": "divider"
                        },
                        {
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": ` \n
                       *Returned* : ${contactModel.email} \n *Note* : ${newUpdate.note} \n`
                            }
                        },

                        {
                            "type": "divider"
                        }
                    ]
                });

            }
        }catch(e){
            console.error(e);
        }
    }

    if(slug.indexOf('-lead') > -1){
        await contactModel.setLead();

    }
    if(slug.indexOf('request-new-redesign') > -1){

        if(process.env.ENVIRONMENT !== 'devq') {
            const token = jwt.sign({user: userModel.id, sub: userModel.id, role: 'readOnly'}, process.env.JWT_TOKEN, {
                expiresIn: '1w'
            });
            const redirectUrl = `${process.env.FRONTEND_URL}/sale/contacts/${contactModel.id}/proposals`;
            const finalUrl = `${process.env.FRONTEND_URL}/#token=${token}&redirect=${redirectUrl}`;
              const name = contactModel.busName ? `*Business:* ${contactModel.busName}` : `*Homeowner:*  ${contactModel.firstName} ${contactModel.lastName}`;
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
                         ${name} (${contactModel.id}) \n *avg Monthly Bill:* ${contactModel.avgMonthlyBill} \n *Utility Provider:* ${contactModel.utilityProvider} \n *Address:*  ${contactModel.fullAddress} \n *Requested By:*  ${userModel.firstName}  ${userModel.lastName}  (${userModel.id} / ${role}) \n *login:* ${finalUrl}`
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
    if(slug.indexOf('appointment-set') > -1){

        if(process.env.ENVIRONMENT !== 'de1v') {
            const token = jwt.sign({user: user, sub: userModel.id, role: 'readOnly'}, process.env.JWT_TOKEN, {
                expiresIn: '1w'
            });
            const redirectUrl = `${process.env.FRONTEND_URL}/sale/contacts/${contactModel.id}/proposals`;
            const finalUrl = `${process.env.FRONTEND_URL}/#token=${token}&redirect=${redirectUrl}`;
            const name = contactModel.busName ? `*Business:* ${contactModel.busName}` : `*Homeowner:*  ${contactModel.firstName} ${contactModel.lastName}`;

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
                        ${name} (${contactModel.id}) \n *avg Monthly Bill:* ${contactModel.avgMonthlyBill} \n *Utility Provider:* ${contactModel.utilityProvider} \n *Address:*  ${contactModel.fullAddress} \n *Requested By:*  ${userModel.firstName}  ${userModel.lastName}  (${userModel.id} / ${role}) \n *login:* ${finalUrl}`
                        }
                    },

                    {
                        "type": "divider"
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
        await contactModel.setOpportunity();
    }

    if (slug.indexOf('close') > -1) {
        await contactModel.setClosed();
    }




    await prisma.contact.update({
        where: {id: contactModel.id},
        data: contactModel
    })
    res.json(newUpdate);

}
