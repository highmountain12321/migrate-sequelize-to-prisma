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

exports.create = async function (req, res, next) {

}
exports.list = async function (req, res, next) {
    const userModel = req.userModel;

    const orderArray = await models.order_status.findAndCountAll();

    return res.json(orderArray);
}
exports.update = async function (req, res, next) {

}
exports.delete = async function (req, res, next) {

}
