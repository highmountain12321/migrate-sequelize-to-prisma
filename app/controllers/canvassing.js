/**
 * Module dependencies.
 */

const {wrap: async} = require('co');
const only = require('only');
const assign = Object.assign;
const _ = require('lodash');
const {models} = require('../../sequelize');
const moment = require('moment');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

exports.list_employees = async function (req, res) {
    const users = await models.user.findAll();
    res.json({data: users});
}
exports.list_contacts = async function (req, res) {
    const users = await models.contact.findAll();
    res.json({data: users});
}

exports.create_contact = async function (req, res) {
    const {user, role} = req.token;

    const body = req.body;
    if (req.body.id) {
        res.status(400).send(`Bad request: ID should not be provided, since it is determined automatically by the database.`)
        return;
    }
    const contact = await models.contact.create(req.body);
    const lead_type = await models.lead_type.findOne({
        where: {
            'permissions': role
        }
    });

    const current_date = moment().utc(false).format();

    contact.set('lead_date', current_date);

    contact.setLead_type(lead_type);

    if (role === 'admin' || role === 'closer') {
        contact.setCloser(user);
        contact.setSetter(user);
    }
    if (role === 'setter') {
        contact.setSetter(user);
    }
    if (body.dispositionId && role !== 'setter') {
        const [disposition] = await models.disposition.findAll({
            where: {
                id: body.dispositionId,
                isActive: true
            }
        }, {raw: true});
        if (disposition && disposition.pitched && disposition.slug.indexOf('close') > -1) {
            contact.set('close_date', current_date);
        }
        if (disposition && disposition.pitched && disposition.slug.indexOf('sit') > -1) {
            contact.set('sit_date', current_date);
        }
        if (disposition && !disposition.pitched && disposition.slug.indexOf('reschedule') > -1) {
            contact.set('reschedule_date', current_date);
        }
        if (disposition && disposition.slug.indexOf('drop') > -1) {
            contact.set('drop_date', current_date);
        }
    }

    await contact.save();

    res.status(200).json({data: contact});
}
exports.update_contact = async function (req, res) {
    const {role} = req.token;
    const body  = req.body;
    const id = req.params.contactId;

    let check_contact = await models.contact.findByPk(id);

    if (role === 'setter') {
        delete body.dispositionId;
        delete body.disposition_id;
    }

    const current_date = moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
    await models.contact.update(body, {where: {id: id}});

    if (body.dispositionId) {
        const [disposition] = await models.disposition.findAll({
            where: {
                id: body.dispositionId,
                isActive: true
            }
        }, {raw: true});
        if (!disposition) {
            res.json({message: `Disposition is not found ${body.dispositionId}`});
            return;
        }

        await check_contact.reload();

        if (disposition && disposition.pitched && disposition.slug.indexOf('close') > -1) {
            check_contact.set('close_date', current_date);
        }
        if (disposition && disposition.pitched && disposition.slug.indexOf('sit') > -1) {
            check_contact.set('sit_date', current_date);
        }
        if (disposition && !disposition.pitched && disposition.slug.indexOf('reschedule') > -1) {
            check_contact.set('reschedule_date', current_date);
        }
        if (disposition && disposition.slug.indexOf('drop') > -1) {
            check_contact.set('drop_date', current_date);
        }
    }
    await check_contact.save();

    res.status(201).json(true);
}

exports.delete_contact = async function (req, res) {

    const contactId = req.params.contactId;

    const contact_status = await models.contact_statuses.findAll({
        where: {name: 'Delete'},
        attributes: ['id']
    });

    if (contact_status && contact_status.length > 0 && contact_status[0].id) {
        const delete_status_id = contact_status[0].id;
        const contact = await models.contact.findByPk(contactId);

        if (contact) {
            await contact.update({
                'canvas_contact_status_id': delete_status_id
            });
            res.status(200).json(true);
        } else {
            res.status(400).send('Contact not found.');
        }
    } else {
        res.status(400).send('Delete status not found.');
    }
}

exports.get_user_area = async function (req, res) {
    const area = await models.canvas_user_areas.findAll(
        {
            where: {userId: req.params.userId},
            include: [
                {
                    model: models.canvas_area_coords,
                    as: 'coordinates',
                    attributes: {
                        exclude: ['createdAt', 'updatedAt', 'canvas_user_area_id']
                    }
                }
            ],
            attributes: {
                exclude: ['coords', 'createdAt', 'updatedAt']
            }
        }
    );

    res.status(200).json({data: area});

}

exports.create_user_area = async function (req, res) {
    const body = req.body;
    const area = await models.canvas_user_areas.create(body, {
        fields: ['userId']
    });

    let coordinates = body.coordinates;

    if (coordinates && coordinates.length > 0) {
        coordinates.forEach(value => {
            value['canvas_user_area_id'] = area.id;
        });
        const coord = await models.canvas_area_coords.bulkCreate(coordinates);
        await area.save();
        const response = JSON.parse(JSON.stringify(area));
        response['coordinates'] = coord;
        return res.status(200).json({data: response});
    }

    res.status(500).json(false);
}
exports.update_user_area = async function (req, res) {
    const body = req.body;
    const id = req.params.id;

    const area = await models.canvas_user_areas.findByPk(id, {
        attributes: {
            exclude: ['coords', 'createdAt', 'updatedAt']
        }
    });

    let coordinates = body.coordinates;

    if (coordinates && coordinates.length > 0) {
        coordinates.forEach(value => {
            value['canvas_user_area_id'] = area.id;
        });
        const coord = await models.canvas_area_coords.bulkCreate(coordinates, {
            updateOnDuplicate: ['id']
        });
        await area.save();
        const response = JSON.parse(JSON.stringify(area));
        response['coordinates'] = coord;
        return res.status(200).json(true);
    }

    res.status(500).json(false);
}
exports.delete_user_area = async function (req, res, next) {
    try {
        const id = req.params.id;
        const obj = await models.canvas_user_areas.findByPk(id, {
            attributes: {
                exclude: ['coords']
            }
        });
        await obj.destroy();
        res.json(true);
    } catch (e) {
        next(e);
    }
}
exports.get_contact_by_employee_id = async function (req, res) {
    const userId = req.params.userId;
    if (!userId) {
        res.status(400).send(`Bad request: ID should be provided.`);
        return;
    }

    const contact_status = await models.contact_statuses.findAll({
        where: {name: 'Delete'},
        attributes: ['id']
    });

    if (contact_status && contact_status.length > 0 && contact_status[0].id) {
        const delete_status_id = contact_status[0].id;

        const contacts = await models.contact.findAll({
            where: {
                userId: userId,
                canvas_contact_status_id: {
                    [Op.and]: {
                        [Op.ne]: null,
                        [Op.ne]: delete_status_id
                    }
                }
            }
        });

        res.status(200).json({data: contacts});
    } else {
        const contacts = await models.contact.findAll({
            where: {userId: userId}
        });
        res.status(200).json({data: contacts});
    }
}

