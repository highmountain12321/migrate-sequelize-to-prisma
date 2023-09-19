'use strict';

/**
 * Module dependencies.
 */

const { wrap: async } = require('co');
const _ = require('lodash');
const { models } = require('../../../sequelize');
const {QueryTypes,Op} = require("sequelize");
const Sequelize = require('sequelize');
const {Services} = require("../../services");

exports.createCharge = async function (req, res, next) {
    const order = req.body;
    try {
        const userModel = req.userModel;
        if (!await userModel.isAdmin()) {
            res.json({error: 'Not authorized'});
        }
        const orderModel = req.loadedOrderModel;
        const repModel = orderModel.user;
        const responseOrder = await repModel.createCharge(order.amount, {orderId: orderModel.id});


        if(!responseOrder){
            res.json({error:'Missing Card'});
            return;
        }
        if(responseOrder.paid){
            orderModel.amount = order.amount;
            orderModel.chargeId = responseOrder.id;
            orderModel.fillDate = new Date();
            orderModel.filledById = userModel.id;
            await orderModel.save();

            return res.json({success:true});
        }else{
            return res.json({success:false,message:'Not Paid'});
        }
    }catch(e){
        return res.json({error:e.message});
    }
};

exports.create = async function (req, res, next) {
    const userModel = req.userModel;
    const organizationModel = await userModel.getOrganization();
    const order = req.body
    const newModel = await models.order.create(order);
    await userModel.addOrder(newModel);
    await organizationModel.addOrder(newModel);
    const newM = await newModel.reload({
        include:['status']
    });
    res.json(newM);
}
exports.list = async function (req, res, next) {
    const userModel = req.userModel;
    if(await userModel.isAdmin()){
        const orderArray = await models.order.findAndCountAll({
            order:[['id','DESC']],
            include: ['status','user','type']
        });
        res.json(orderArray);
        return;
    }
    const orders = await userModel.getOrders({
        order:[['id','DESC']],
        include: ['status','type']
    });
    const orderCount = await userModel.countOrders();
    return res.json({
        rows:orders,
        count: orderCount
    })
}
exports.update = async function (req, res, next) {
    const updateObject = req.body;
    const loadedModel = req.loadedOrderModel;
    await loadedModel.update(updateObject);
    res.json(loadedModel);

}
exports.delete = async function (req, res, next) {

}
