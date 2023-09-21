'use strict';

/**
 * Module dependencies.
 */

const { wrap: async } = require('co');
const _ = require('lodash');
const { models } = require('../../../sequelize');
const prisma = require('../../lib/prisma')

exports.listByZone = async function (req, res) {
    const query = req.query;
    let q = {};

    if (query.state) {
        q.where = { state: query.state };
    }

    const partners = await prisma.zone.findMany({
        where: q.where,
        select: {
            id: true,
            partner: {
                where: {
                    isActive: true
                },
                select: {
                    name: true,
                    id: true
                }
            }
        }
    });

    res.json(partners);
};

exports.listZonesByState = async function (req, res) {
    const query = req.query;
    let q = {};

    if (query.state && query.state.length < 2) {
        return res.json([]);
    }

    if (query.state) {
        q.where = { state: query.state };

        const partners = await prisma.zone.findMany({
            where: q.where,
            select: {
                id: true,
                partner: {
                    where: {
                        isActive: true
                    },
                    select: {
                        name: true,
                        id: true
                    }
                }
            }
        });

        res.json(partners);
    } else {
        res.json([]);
    }
};


exports.listByState = async function (req, res) {

}



exports.list = async function (req, res) {
    const { isActive = true, partnerTypeId, state } = req.query;

    if (state) {
        const stateModel = await prisma.state.findFirst({
            where: {
                code: state
            }
        });

        const areas = await prisma.area.findMany({
            where: {
                stateId: stateModel.id,  // Assuming a stateId field on area model
                isActive: isActive
            },
            orderBy: {
                id: 'desc'
            },
            include: {
                partner: {
                    where: {
                        isActive: true
                    },
                    include: {
                        type: {
                            where: {
                                id: parseInt(partnerTypeId)
                            }
                        }
                    }
                }
            }
        });

        const partnerArray = areas.map(m => m.partner);
        res.json({ rows: partnerArray, count: partnerArray.length });
        return;
    }

    let query = {
        where: {
            isActive: isActive
        },
        include: {
            sectors: true,
            type: true
        },
        orderBy: {
            id: 'desc'
        }
    };

    if (partnerTypeId) {
        query = _.merge(query, {
            include: {
                type: {
                    where: {
                        id: parseInt(partnerTypeId)
                    }
                }
            }
        });
    }

    const partners = await prisma.partner.findMany(query);
    res.json({
        rows: partners,
        count: partners.length
    });
};



exports.listLenders = async function (req, res) {
    const id = req.params.partnerId;

    let partner = await prisma.partner.findFirst({
        where: { id: parseInt(id) },
        select: {
            id: true,
            lenders: true  // Assuming there's a relation between partner and lender
        }
    });

    if (!partner) {
        partner = { lenders: [] };
    }

    const noneLender = await prisma.lender.findFirst({
        where: {
            slug: 'none'
        },
        select: {
            name: true,
            id: true,
            slug: true
        }
    });

    if (!partner.lenders) {
        partner.lenders = [];
    }

    partner.lenders.push(noneLender);
    res.json(partner);
};

exports.listZones = async function (req, res) {
    const id = req.params.id;

    const partner = await prisma.partner.findFirst({
        where: { id: parseInt(id) },
        select: {
            id: true,
            zones: true  // Assuming there's a relation between partner and zone
        }
    });

    res.json(partner);
};

exports.listDocuments = async function (req, res) {
    const id = req.params.id;

    const partner = await prisma.partner.findFirst({
        where: { id: parseInt(id) },
        select: {
            id: true,
            documents: { // Assuming there's a relation between partner and document
                select: {
                    id: true,
                    originalName: true, // Assuming this field exists in the document model
                    typeId: true,
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

    res.json(partner);
};

exports.count = async function (req, res) {
    const count = await prisma.partner.count();
    res.json({
        count: count,
    });
};


exports.create = async function (req, res, next) {
    const { user, role } = req.token;

    try {

        const body = req.body;
        const { sectors, virtServiceAreaStates, modules, inverters, batteries } = body;
        delete body.virtServiceAreaStates;
        delete body.modules;
        delete body.inverters;
        delete body.batteries;

        delete body.sectors;
        const partnerModel = await models.partner.create(body, {
            include: [
                {
                    model: models.equipment_residential_battery,
                    as: "batteries",
                },
                {
                    model: models.equipment_residential_inverter,
                    as: "inverters",
                },
                {
                    model: models.equipment_residential_module,
                    as: "modules",
                },
                {
                    model: models.partner_sector,
                    as: "sectors",
                },
                {
                    model: models.partner_type,
                    as: "type",
                },
                {
                    model: models.service_area,
                    as: "areas",
                    include: [
                        {
                            model: models.state,
                            as: "state",
                        }]
                },
            ]
        });



        if (inverters) {
            for (let i = 0; i < inverters.length; i++) {
                await partnerModel.addInverter(inverters[i].id);
            }
        }
        if (batteries) {
            for (let i = 0; i < batteries.length; i++) {
                await partnerModel.addBattery(batteries[i].id);
            }
        }
        if (modules) {
            for (let i = 0; i < modules.length; i++) {
                await partnerModel.addModule(modules[i].id);
            }
        }
        if (sectors) {
            const ids = sectors.map(m => m.id);
            await partnerModel.addSectorsById(ids);
        }
        if (virtServiceAreaStates) {
            const newIds = virtServiceAreaStates.map(a => a.id);
            const oldIds = partnerModel.virtServiceAreaStates.map(a => a.id);
            const added = _.difference(newIds, oldIds);
            for (let i = 0; i < added.length; i++) {
                const addedId = added[i];
                const newServiceArea = await models.service_area.create({
                    isActive: 1,
                    stateId: addedId
                })
                await partnerModel.addArea(newServiceArea);
            }

        }

        await partnerModel.reload();
        res.json(partnerModel);
    } catch (e) {
        console.error(e);
        next(e);
    }
}

exports.update = async function (req, res) {
    const partnerId = req.params.partnerId;
    const body = req.body;
    const { sectors, virtServiceAreaStates, inverters, modules, batteries, lenders } = body;
    const partnerModel = await models.partner.findByPk(partnerId, {
        include: [
            {
                model: models.equipment_residential_battery,
                as: "batteries",
            },
            {
                model: models.equipment_residential_inverter,
                as: "inverters",
            },
            {
                model: models.equipment_residential_module,
                as: "modules",
            },
            {
                model: models.partner_sector,
                as: "sectors",
            },
            {
                model: models.partner_type,
                as: "type",
            },
            {
                model: models.lender,
                as: "lenders",
            },
            {
                model: models.service_area,
                as: "areas",
                include: [
                    {
                        model: models.state,
                        as: "state",
                    }]
            },
        ]
    });


    if (lenders) {
        const newIds = lenders.map(a => a.id);
        const oldIds = partnerModel.lenders.map(a => a.id);
        const added = _.difference(newIds, oldIds);
        const removed = _.difference(oldIds, newIds);
        for (let i = 0; i < removed.length; i++) {
            const removedId = removed[i];
            const removeObj = partnerModel.lenders.find(a => a.id === removedId);
            await partnerModel.removeLender(removeObj)
        }
        for (let i = 0; i < added.length; i++) {
            const addedId = added[i];
            const obj = lenders.find(a => a.id === addedId)
            await partnerModel.addLender(obj.id);
        }
    }
    if (modules) {
        const newIds = modules.map(a => a.id);
        const oldIds = partnerModel.modules.map(a => a.id);
        const added = _.difference(newIds, oldIds);
        const removed = _.difference(oldIds, newIds);
        for (let i = 0; i < removed.length; i++) {
            const removedId = removed[i];
            const removeObj = partnerModel.modules.find(a => a.id === removedId);
            await partnerModel.removeModule(removeObj)
        }
        for (let i = 0; i < added.length; i++) {
            const addedId = added[i];
            const obj = modules.find(a => a.id === addedId)
            await partnerModel.addModule(obj.id);
        }
    }


    if (inverters) {
        const newIds = inverters.map(a => a.id);
        const oldIds = partnerModel.inverters.map(a => a.id);
        const added = _.difference(newIds, oldIds);
        const removed = _.difference(oldIds, newIds);
        for (let i = 0; i < removed.length; i++) {
            const removedId = removed[i];
            const removeObj = partnerModel.inverters.find(a => a.id === removedId);
            await partnerModel.removeInverter(removeObj)
        }
        for (let i = 0; i < added.length; i++) {
            const addedId = added[i];
            const battery = inverters.find(a => a.id === addedId)
            await partnerModel.addInverter(battery.id);
        }
    }

    if (batteries) {
        const newIds = batteries.map(a => a.id);
        const oldIds = partnerModel.batteries.map(a => a.id);
        const added = _.difference(newIds, oldIds);
        const removed = _.difference(oldIds, newIds);
        for (let i = 0; i < removed.length; i++) {
            const removedId = removed[i];
            const removeObj = partnerModel.batteries.find(a => a.id === removedId);
            await partnerModel.removeBattery(removeObj)
        }
        for (let i = 0; i < added.length; i++) {
            const addedId = added[i];
            const battery = batteries.find(a => a.id === addedId)
            await partnerModel.addBattery(battery.id);
        }
    }


    if (virtServiceAreaStates) {
        const newIds = virtServiceAreaStates.map(a => a.id);
        const oldIds = partnerModel.virtServiceAreaStates.map(a => a.id);
        const added = _.difference(newIds, oldIds);
        const removed = _.difference(oldIds, newIds);
        for (let i = 0; i < removed.length; i++) {
            const removedId = removed[i];
            const removeArea = partnerModel.areas.find(a => a.stateId === removedId);
            await models.service_area.destroy({ where: { id: removeArea.id } });
        }
        for (let i = 0; i < added.length; i++) {
            const addedId = added[i];
            const newServiceArea = await models.service_area.create({
                isActive: 1,
                stateId: addedId
            })
            await partnerModel.addArea(newServiceArea);
        }

    }
    if (sectors) {
        delete body.sectors;
        const newIds = sectors.map(a => a.id);
        const oldIds = partnerModel.sectors.map(a => a.id);
        const addedSectors = _.difference(newIds, oldIds);
        const removedSectors = _.difference(oldIds, newIds);
        removedSectors.map(async id => {
            const rm = partnerModel.sectors.find(a => a.id === id);
            await partnerModel.removeSector(rm)
        });
        addedSectors.map(async id => await partnerModel.addSector(id));
    }
    delete body.virtServiceAreaStates;
    await partnerModel.update(body);
    const reloaded = await partnerModel.reload();
    res.status(201).json(reloaded);

}


exports.show = async function (req, res) {
    const id = req.params.id;
    const obj = await models.partner.findByPk(id, {
        include: [
            {
                model: models.equipment_residential_battery,
                as: "batteries",
            },
            {
                model: models.equipment_residential_inverter,
                as: "inverters",
            },
            {
                model: models.equipment_residential_module,
                as: "modules",
            },
            {
                model: models.partner_sector,
                as: "sectors",
            },
            {
                model: models.partner_type,
                as: "type",
            },
            {
                model: models.lender,
                as: "lenders",
            },
            {
                model: models.service_area,
                as: "areas",
                include: [{
                    model: models.state,
                    as: "state",
                }]
            },
        ],
    });
    res.status(200).json(obj);
};


exports.removeSector = async function (req, res, next) {
    try {
        const id = req.params.partnerId;
        const sectorId = req.params.sectorId;

        const obj = await models.partner.findByPk(id)
        const d = await obj.destroyPartner_Sector(sectorId)
        res.json(d);
    } catch (e) {
        console.log(e);
        next(e);
    }
}
exports.addSector = async function (req, res, next) {
    try {
        const id = req.params.partnerId;
        const obj = await models.partner.findByPk(id)
        const response = await obj.destroy()
        res.json(response);
    } catch (e) {
        console.log(e);
        next(e);
    }
}


exports.destroy = async function (req, res, next) {
    try {
        const id = req.params.partnerId;
        const obj = await models.partner.findByPk(id)
        const response = await obj.destroy()
        res.json(response);
    } catch (e) {
        console.log(e);
        next(e);
    }
}



exports.createPanel = async function (req, res) {
    const newObj = await models.partner.create(req.body);
    res.json(newObj);
}
exports.listPanels = async function (req, res) {
    const newObj = await models.partner.create(req.body);
    res.json(newObj);
}
exports.deletePanel = async function (req, res) {
    const newObj = await models.partner.create(req.body);
    res.json(newObj);
}

exports.listClosingForms = async function (req, res, next) {
    const partnerId = req.params.partnerId;
    const { user, role } = req.token;




    const closingforms = await models.closing_form.findAll({
        where: {
            partnerId: partnerId
        },
        include: [
            {
                model: models.closing_form_update,
                as: 'update',
                attributes: ['toId', 'createdAt'],
                include: [{
                    model: models.closing_form_update_type,
                    as: 'to',
                    attributes: ['name']
                }]
            },
            {
                model: models.contact,
                as: 'contact',
                attributes: ['firstName', 'lastName'],
                include: [{
                    model: models.user,
                    as: 'users',
                    attributes: ['firstName', 'lastName', 'roleId', 'picUrl'],
                    include: [{
                        model: models.role,
                        as: 'role',
                        attributes: ['name']
                    }]
                }]
            }
        ],
        order: [
            ['id', 'DESC']
        ]
    });






    res.json({
        closingforms: closingforms
    })
}



exports.patchResidentialModule = async function (req, res, next) {

}
exports.patchResidentialInverter = async function (req, res, next) {
    const partnerModel = req.loadedPartnerModel;
    const obj = req.body;
    let id = obj.add;
    if (obj.remove) {
        id = obj.remove;
    }
    try {
        if (!partnerModel || partnerModel.isActive === false) {
            return next({ message: 'Partner is not active' });
        }
        const model = await models.equipment_residential_inverter.findByPk(id);
        if (!model || model.isActive === false) {
            return next({ message: 'Not active' });
        }
        if (obj.add) {
            await partnerModel.addInverter(id);
        }
        if (obj.remove) {
            await partnerModel.removeInverter(id);
        }

        res.status(201).json(partnerModel);
    } catch (e) {
        next({ message: e.message });
    }
}
exports.patchResidentialBattery = async function (req, res, next) {

}
