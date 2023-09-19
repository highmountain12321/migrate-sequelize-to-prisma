'use strict';

/**
 * Module dependencies.
 */

const { wrap: async } = require('co');
const _ = require('lodash');
const { models } = require('../../../sequelize');




/**
 * List
 */

exports.listByZone = async function (req, res) {
  const query = req.query;
  let q = {};
  if(query.state){
    q.where = {state:query.state};
  }
  const partners = await models.zone.findAll(
      {
        where: q.where,
          attributes:['id'],
          include:[{
              model: models.partner,
              attributes:['name','id'],
              as: "partner",
              where: {
                  isActive: true
              }
          },
          ]
      }
  );
  res.json(partners);
}



exports.listZonesByState = async function (req, res) {
  const query = req.query;
  let q = {};
  if(query.state.length < 2){
    return res.json([]);
  }
  if(query.state){

    q.where = {state:query.state};
    const partners = await models.zone.findAll(
        {
          where: q.where,
            attributes:['id'],
            include:[{
              model: models.partner,
              attributes:['name','id'],
              as: "partner",
              where: {
                  isActive: true
              }
          },
          ]
        }
    );
    res.json(partners);
    return;
  } else {
    res.json([]);
  }
}


exports.listByState = async function (req, res) {

}


exports.list = async function (req, res) {
  const {isActive = true, partnerTypeId, state} = req.query
    if(state){
        const stateModel = await models.state.findOne({
            where:{
            code:state
            }});
        const areas = await stateModel.getAreas({
                isActive,
            order: [
                ['id', 'DESC']
            ],
                include: [
                    {
                        where:{
                            isActive:true
                        },
                        model: models.partner,
                        as: "partner",
                        include: [{
                            model: models.partner_type,
                            as: "type",
                            where:{
                                id:partnerTypeId
                            }
                        }
                            ]
                    }
                    ],
            });
        if(!areas){
            return res.json({rows:[], count:0});
        }
        const partnerArray = areas.map((m)=> m.partner);
        res.json({rows:partnerArray, count: partnerArray.length});
        return;
    }
    const query = {
        where: {
            isActive,
        },
        include: [
            {
                model: models.partner_sector,
                as: "sectors",
            },
            {
                model: models.partner_type,
                as: "type",
            },
        ],
        order: [
            ['id', 'DESC']
        ]
    };
    if(partnerTypeId){

            const typeInclude = (_.find(query.include, { as: 'type' }));
            typeInclude.required = true;
            typeInclude.where = {
                id: partnerTypeId
            }
    }


  const partners = await models.partner.findAndCountAll(query);
  res.json(partners);
}

exports.listLenders = async function (req, res) {
  const id = req.params.partnerId;
    let partner = await models.partner.findByPk(
        id,
        {
            attributes:['id'],
          include: [
              {
                  model: models.lender,
                  as: "lenders",
              }
          ],
        }
    );
    if(!partner){
        partner = {lenders:[]};
    }
    const noneLender = await models.lender.findOne({
        attributes:['name','id','slug'],
        where:{
            slug:'none'
        },
        }
    );
    if(!partner.lenders){
        partner.lenders = [];
    }
    partner.lenders.push(noneLender);
    res.json(partner);
    return;
}
exports.listZones = async function (req, res) {
    const id = req.params.id;
    const partner = await models.partner.findByPk(
        id,
        {
            attributes:['id'],
            include: [
                {
                    model: models.zone,
                    as: "zones"
                },
            ],
        }
    );

    res.json(partner);
    return;
}

exports.listDocuments = async function (req, res) {
    const id = req.params.id;
    const partner = await models.partner.findByPk(
        id,
        {
            attributes:['id'],
            include: [
                {
                    model: models.document,
                    as: "documents",
                    include:[{
                        attributes: ['name','slug'],
                        model: models.document_type,
                        as: 'type'
                    }]
                },
            ],
        }
    );

    res.json(partner);
    return;
}
exports.count = async function (req, res) {
  const count = await models.partner.count();
  res.json({
    count: count,
  })
}

exports.create = async function (req, res,next) {
    const {user, role} = req.token;

    try {

    const body = req.body;
    const {sectors, virtServiceAreaStates, modules,inverters, batteries} = body;
    delete body.virtServiceAreaStates;
        delete body.modules;
        delete body.inverters;
        delete body.batteries;

        delete body.sectors;
    const partnerModel = await models.partner.create(body,{
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
        ]});



    if(inverters) {
        for(let i = 0; i < inverters.length; i++){
            await partnerModel.addInverter(inverters[i].id);
        }
    }
        if(batteries) {
            for(let i = 0; i < batteries.length; i++){
                await partnerModel.addBattery(batteries[i].id);
            }
        }
        if(modules) {
            for(let i = 0; i < modules.length; i++){
                await partnerModel.addModule(modules[i].id);
            }
        }
    if(sectors) {
        const ids = sectors.map(m => m.id);
        await partnerModel.addSectorsById(ids);
    }
        if(virtServiceAreaStates){
            const newIds = virtServiceAreaStates.map(a => a.id);
            const oldIds = partnerModel.virtServiceAreaStates.map(a => a.id);
            const added = _.difference(newIds, oldIds);
            for(let i = 0; i < added.length; i++){
                const addedId = added[i];
                const newServiceArea = await models.service_area.create({
                    isActive:1,
                    stateId: addedId
                })
                await partnerModel.addArea(newServiceArea);
            }

        }

        await partnerModel.reload();
    res.json(partnerModel);
  }catch(e){
    console.error(e);
    next(e);
  }
}

exports.update = async function (req, res) {
  const partnerId = req.params.partnerId;
  const body =  req.body;
  const {sectors, virtServiceAreaStates, inverters, modules, batteries, lenders} = body;
    const partnerModel = await models.partner.findByPk(partnerId,{
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
        ]});


    if(lenders){
        const newIds = lenders.map(a => a.id);
        const oldIds = partnerModel.lenders.map(a => a.id);
        const added = _.difference(newIds, oldIds);
        const removed = _.difference(oldIds, newIds);
        for(let i = 0; i < removed.length; i++){
            const removedId = removed[i];
            const removeObj = partnerModel.lenders.find(a => a.id === removedId);
            await partnerModel.removeLender(removeObj)
        }
        for(let i = 0; i < added.length; i++){
            const addedId = added[i];
            const obj = lenders.find(a => a.id === addedId)
            await partnerModel.addLender(obj.id);
        }
    }
    if(modules){
        const newIds = modules.map(a => a.id);
        const oldIds = partnerModel.modules.map(a => a.id);
        const added = _.difference(newIds, oldIds);
        const removed = _.difference(oldIds, newIds);
        for(let i = 0; i < removed.length; i++){
            const removedId = removed[i];
            const removeObj = partnerModel.modules.find(a => a.id === removedId);
            await partnerModel.removeModule(removeObj)
        }
        for(let i = 0; i < added.length; i++){
            const addedId = added[i];
            const obj = modules.find(a => a.id === addedId)
            await partnerModel.addModule(obj.id);
        }
    }


    if(inverters){
        const newIds = inverters.map(a => a.id);
        const oldIds = partnerModel.inverters.map(a => a.id);
        const added = _.difference(newIds, oldIds);
        const removed = _.difference(oldIds, newIds);
        for(let i = 0; i < removed.length; i++){
            const removedId = removed[i];
            const removeObj = partnerModel.inverters.find(a => a.id === removedId);
            await partnerModel.removeInverter(removeObj)
        }
        for(let i = 0; i < added.length; i++){
            const addedId = added[i];
            const battery = inverters.find(a => a.id === addedId)
            await partnerModel.addInverter(battery.id);
        }
    }

    if(batteries){
        const newIds = batteries.map(a => a.id);
        const oldIds = partnerModel.batteries.map(a => a.id);
        const added = _.difference(newIds, oldIds);
        const removed = _.difference(oldIds, newIds);
        for(let i = 0; i < removed.length; i++){
            const removedId = removed[i];
            const removeObj = partnerModel.batteries.find(a => a.id === removedId);
            await partnerModel.removeBattery(removeObj)
        }
        for(let i = 0; i < added.length; i++){
            const addedId = added[i];
            const battery = batteries.find(a => a.id === addedId)
            await partnerModel.addBattery(battery.id);
        }
    }


    if(virtServiceAreaStates){
        const newIds = virtServiceAreaStates.map(a => a.id);
        const oldIds = partnerModel.virtServiceAreaStates.map(a => a.id);
        const added = _.difference(newIds, oldIds);
        const removed = _.difference(oldIds, newIds);
        for(let i = 0; i < removed.length; i++){
            const removedId = removed[i];
            const removeArea = partnerModel.areas.find(a => a.stateId === removedId);
            await models.service_area.destroy({where:{id:removeArea.id}});
        }
        for(let i = 0; i < added.length; i++){
            const addedId = added[i];
            const newServiceArea = await models.service_area.create({
                isActive:1,
                stateId: addedId
            })
            await partnerModel.addArea(newServiceArea);
        }

    }
  if(sectors){
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
  const reloaded =  await partnerModel.reload();
  res.status(201).json(reloaded);

}


exports.show = async function (req, res) {
  const id = req.params.id;
  const obj = await models.partner.findByPk( id,{
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
              include:[{
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
    }catch(e){
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
    }catch(e){
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
  }catch(e){
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

exports.listClosingForms = async function (req, res,next) {
    const partnerId = req.params.partnerId;
    const {user, role} = req.token;




    const closingforms = await models.closing_form.findAll({
        where:{
            partnerId:partnerId
        },
        include: [
            {
                model: models.closing_form_update,
                as: 'update',
                attributes:['toId','createdAt'],
                include:[ {
                    model: models.closing_form_update_type,
                    as: 'to',
                    attributes: ['name']
                }]
            },
            {
                model: models.contact,
                as: 'contact',
                attributes:['firstName','lastName'],
                include:[{
                    model: models.user,
                    as: 'users',
                    attributes:['firstName','lastName','roleId','picUrl'],
                    include:[ {
                        model: models.role,
                        as: 'role',
                        attributes:['name']
                    }]
                }]
            }
        ],
        order: [
            ['id', 'DESC']
        ]
    });






    res.json({
        closingforms:closingforms
    })
}



exports.patchResidentialModule = async function (req, res, next) {

}
exports.patchResidentialInverter = async function (req, res, next) {
    const partnerModel = req.loadedPartnerModel;
    const obj = req.body;
    let id = obj.add;
    if(obj.remove){
        id = obj.remove;
    }
    try {
        if(!partnerModel || partnerModel.isActive === false){
            return next({message:'Partner is not active'});
        }
        const model = await models.equipment_residential_inverter.findByPk(id);
        if(!model || model.isActive === false){
            return next({message:'Not active'});
        }
        if(obj.add) {
            await partnerModel.addInverter(id);
        }
        if(obj.remove){
            await partnerModel.removeInverter(id);
        }

        res.status(201).json(partnerModel);
    }catch(e){
        next({message:e.message});
    }
}
exports.patchResidentialBattery = async function (req, res, next) {

}
