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

    const createdPartner = await prisma.partner.create({
      data: {
        ...body,
        sectors: {
          connect: sectors.map(sector => ({ id: sector.id }))
        },
        modules: {
          connect: modules.map(module => ({ id: module.id }))
        },
        inverters: {
          connect: inverters.map(inverter => ({ id: inverter.id }))
        },
        batteries: {
          connect: batteries.map(battery => ({ id: battery.id }))
        },
        // Add other relations similarly
      },
      include: {
        batteries: true,
        inverters: true,
        modules: true,
        sectors: true,
        type: true,
        areas: {
          include: {
            state: true
          }
        }
      }
    });

    if (virtServiceAreaStates) {
      const newIds = virtServiceAreaStates.map(a => a.id);
      const oldIds = createdPartner.virtServiceAreaStates.map(a => a.id);
      const added = _.difference(newIds, oldIds);
      
      for (const addedId of added) {
        const newServiceArea = await prisma.service_area.create({
          data: {
            isActive: 1,
            stateId: addedId
          }
        });
        
        await prisma.partner.update({
          where: { id: createdPartner.id },
          data: {
            areas: {
              connect: { id: newServiceArea.id }
            }
          }
        });
      }
    }

    const updatedPartner = await prisma.partner.findUnique({
      where: { id: createdPartner.id },
      include: {
        batteries: true,
        inverters: true,
        modules: true,
        sectors: true,
        type: true,
        areas: {
          include: {
            state: true
          }
        }
      }
    });

    res.json(updatedPartner);
  } catch (e) {
    console.error(e);
    next(e);
  }
};



exports.update = async function (req, res) {
    const partnerId = req.params.partnerId;
    const body = req.body;
    const { sectors, virtServiceAreaStates, inverters, modules, batteries, lenders } = body;

    const partnerModel = await prisma.partner.findUnique({
        where: { id: partnerId },
        include: {
            batteries: true,
            inverters: true,
            modules: true,
            sectors: true,
            type: true,
            lenders: true,
            areas: {
                include: {
                    state: true
                }
            }
        }
    });

    const updateAssociations = async (currentData, newData, associationName) => {
        const newIds = newData.map(a => a.id);
        const oldIds = currentData.map(a => a.id);
        const added = _.difference(newIds, oldIds);
        const removed = _.difference(oldIds, newIds);

        for (const removedId of removed) {
            await prisma.partner.update({
                where: { id: partnerId },
                data: { [associationName]: { disconnect: { id: removedId } } }
            });
        }
        for (const addedId of added) {
            await prisma.partner.update({
                where: { id: partnerId },
                data: { [associationName]: { connect: { id: addedId } } }
            });
        }
    };

    if (lenders) {
        await updateAssociations(partnerModel.lenders, lenders, "lenders");
    }

    if (modules) {
        await updateAssociations(partnerModel.modules, modules, "modules");
    }

    if (inverters) {
        await updateAssociations(partnerModel.inverters, inverters, "inverters");
    }

    if (batteries) {
        await updateAssociations(partnerModel.batteries, batteries, "batteries");
    }

    if (virtServiceAreaStates) {
        const newIds = virtServiceAreaStates.map(a => a.id);
        const oldIds = partnerModel.areas.map(a => a.stateId);
        const added = _.difference(newIds, oldIds);
        const removed = _.difference(oldIds, newIds);

        for (const removedId of removed) {
            const removeArea = partnerModel.areas.find(a => a.stateId === removedId);
            await prisma.service_area.delete({ where: { id: removeArea.id } });
        }
        for (const addedId of added) {
            await prisma.service_area.create({
                data: {
                    isActive: 1,
                    stateId: addedId,
                    partnerId: partnerId // assuming there's a relation field
                }
            });
        }
    }

    if (sectors) {
        await updateAssociations(partnerModel.sectors, sectors, "sectors");
    }

    delete body.sectors;
    delete body.virtServiceAreaStates;

    const updatedPartner = await prisma.partner.update({
        where: { id: partnerId },
        data: body,
        include: {
            batteries: true,
            inverters: true,
            modules: true,
            sectors: true,
            type: true,
            lenders: true,
            areas: {
                include: {
                    state: true
                }
            }
        }
    });

    res.status(201).json(updatedPartner);
};

exports.show = async function (req, res) {
    const id = parseInt(req.params.id);
    
    try {
        const obj = await prisma.partner.findUnique({
            where: { id },
            include: {
                batteries: true,
                inverters: true,
                modules: true,
                sectors: true,
                type: true,
                lenders: true,
                areas: {
                    include: {
                        state: true
                    }
                }
            }
        });
        res.status(200).json(obj);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve partner details." });
    }
};

exports.removeSector = async function (req, res, next) {
    const id = parseInt(req.params.partnerId);
    const sectorId = parseInt(req.params.sectorId);

    try {
        // Disconnect the relation between the partner and the sector
        const updatedPartner = await prisma.partner.update({
            where: { id },
            data: {
                sectors: {
                    disconnect: { id: sectorId }
                }
            }
        });
        
        res.status(200).json(updatedPartner);
    } catch (e) {
        console.log(e);
        next(e);
    }
};
exports.addSector = async function (req, res, next) {
    const id = parseInt(req.params.partnerId);

    try {
        const response = await prisma.partner.delete({ where: { id } });
        res.json(response);
    } catch (e) {
        console.log(e);
        next(e);
    }
};
exports.destroy = async function (req, res, next) {
    const id = parseInt(req.params.partnerId);

    try {
        const response = await prisma.partner.delete({ where: { id } });
        res.json(response);
    } catch (e) {
        console.log(e);
        next(e);
    }
};
exports.createPanel = async function (req, res) {
    try {
        const newObj = await prisma.partner.create({ data: req.body });
        res.json(newObj);
    } catch (error) {
        res.status(500).json({ error: "Failed to create partner." });
    }
};
exports.listPanels = async function (req, res) {
    try {
        const partners = await prisma.partner.findMany();
        res.json(partners);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve partners." });
    }
};
exports.deletePanel = async function (req, res) {
    const id = parseInt(req.params.partnerId);

    try {
        const response = await prisma.partner.delete({ where: { id } });
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: "Failed to delete partner." });
    }
};
exports.listClosingForms = async function (req, res, next) {
    const partnerId = parseInt(req.params.partnerId);
    const { user, role } = req.token;

    try {
        const closingforms = await prisma.closing_form.findMany({
            where: {
                partnerId: partnerId
            },
            include: {
                update: {
                    select: {
                        toId: true,
                        createdAt: true,
                        to: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                contact: {
                    select: {
                        firstName: true,
                        lastName: true,
                        users: {
                            select: {
                                firstName: true,
                                lastName: true,
                                roleId: true,
                                picUrl: true,
                                role: {
                                    select: {
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                id: 'desc'
            }
        });

        res.json({
            closingforms: closingforms
        });
    } catch (error) {
        next({ message: error.message });
    }
};
exports.patchResidentialModule = async function (req, res, next) {

}
exports.patchResidentialInverter = async function (req, res, next) {
    const partnerModel = req.loadedPartnerModel; // This is not clear, make sure to adjust this as needed.
    const obj = req.body;
    let id = obj.add;

    if (obj.remove) {
        id = obj.remove;
    }

    try {
        if (!partnerModel || partnerModel.isActive === false) {
            return next({ message: 'Partner is not active' });
        }

        const model = await prisma.equipment_residential_inverter.findUnique({
            where: { id: id }
        });

        if (!model || model.isActive === false) {
            return next({ message: 'Not active' });
        }

        if (obj.add) {
            // Assuming a relation here
            await prisma.partner.update({
                where: { id: partnerModel.id },
                data: { inverters: { connect: { id: id } } }
            });
        }
        
        if (obj.remove) {
            // Assuming a relation here
            await prisma.partner.update({
                where: { id: partnerModel.id },
                data: { inverters: { disconnect: { id: id } } }
            });
        }

        // If you need the updated partner model
        const updatedPartnerModel = await prisma.partner.findUnique({
            where: { id: partnerModel.id }
        });

        res.status(201).json(updatedPartnerModel);
    } catch (e) {
        next({ message: e.message });
    }
};
exports.patchResidentialBattery = async function (req, res, next) {

}
