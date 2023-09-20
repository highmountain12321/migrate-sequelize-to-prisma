const prisma = require('../../lib/prisma');

const { Services } = require("../../services");

exports.create = async function (req, res, next) {
    // Function is empty. When implemented, use prisma.orderStatus.create() to create a new order status.
}

exports.list = async function (req, res, next) {
    const user = req.user;

    const orderStatuses = await prisma.orderStatus.findMany();
    
    res.json({
        count: orderStatuses.length,
        rows: orderStatuses
    });
}

exports.update = async function (req, res, next) {
    // Function is empty. When implemented, use prisma.orderStatus.update() to update an order status.
}

exports.delete = async function (req, res, next) {
    // Function is empty. When implemented, use prisma.orderStatus.delete() to remove an order status.
}
