/**
 * Module dependencies.
 */


const { wrap: async } = require('co');
const only = require('only');
const assign = Object.assign;
const _ = require('lodash');
const sequalize = require('../../sequelize');
const {Op} = require("sequelize");
const moment = require("moment");
const { models } = sequalize;




exports.list = async function (req, res) {
    const userModel = req.userModel;

    const where = {};

    const appointments = await userModel.getAppointments( {
        isActive: true,
        attributes:['startDate','endDate','typeId','timezone'],
        where: where,
        include:[
            {
                model:models.contact,
                as:'contact',
                attributes:['email','primaryPhone','firstName','lastName','id','name']
            },
            {
                model:models.appointment_type,
                as:'type',
                attributes:['name']
            }
        ],
        order: [['startDate','ASC']]
    });


        const newData = appointments.map((appt) => {
            if (appt.startDate && appt.timezoneOffset) {
                appt.startDate = moment(appt.startDate).utcOffset(appt.timezoneOffset).format()
                appt.endDate = moment(appt.endDate).utcOffset(appt.timezoneOffset).format()
            }
            return appt;
        });
        res.json(newData);


}
exports.listAppointmentTypes = async function (req, res) {
    const data = await models.appointment_type.findAll({
        where: {
            isActive: true
        }
    });
    res.json(data);
}
exports.listStatuses = async function (req, res) {
    let role = req.token.role;
    let where = {isActive:true};
    if(role === 'setter'){
        where.permissions = 'setter'
    }

    const obj_array = await models.appointment_status.findAll({
        where:where
    });
    res.json({data: obj_array});
}
exports.count = async function (req, res) {
    const count = await models.appointment.count();
    res.json({
        count: count,
    })
}



exports.create = async function(req, res,next) {

    const assignment_query = `SELECT  DISTINCT users.id, 
       (SELECT COUNT(*) FROM contacts
        WHERE closerId = users.id) AS memberCount, slug
FROM users 
        LEFT JOIN roles on users.role_id = roles.id
        WHERE roles.slug = 'closer'
order by memberCount ASC;
        `;



    const body = req.body;




    const contact = await models.contact.findByPk( body.contactId,{
        include: [
            {
                model:models.contact_update,
                as:'update',
                include:[{
                    model:models.option,
                    as: 'to'

                }]
            }
            ]
    });
    if(!contact){
        next({
            message:`Contact ${body.contactId} not found`
        });
        return;
    }



    const newAppointment = await models.appointment.create(body);
    newAppointment.contactId = contact.id;
    newAppointment.statusId = body.statusId;

    const saved= await newAppointment.save();



    await contact.save();


    res.status(201).json(saved);
}





/**
 * Update contact
 */

exports.update = async function(req, res,next) {

    const id = req.params.appointmentId;
    if (req.body.id) {
        res.status(400).send(`Bad request: ID should not be provided, since it is determined automatically by the database.`)
        return;
    }
    const obj = await models.appointment.update(req.body, { where: { id: id } });
    res.status(201).json({data:obj});

};



exports.show = async function (req, res) {
    const id = req.params.appointmentId;
    const obj = await models.contact.findByPk( id,{include:[
            'contact_method','type'
        ]});

    res.status(200).json({data:obj});
};




exports.destroy = async function (req, res,next) {
    try {
        const id = req.params.id;
        const obj = await models.appointment.findByPk(id)
        const response = await obj.destroy()
        res.json({data: response});
    }catch(e){
        console.log(e);
        next(e);
    }
}
