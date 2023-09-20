const prisma = require("../../../prisma/client");
const { Services } = require("../../services");

exports.createCharge = async function (req, res, next) {
    const order = req.body;
    try {
        const user = req.user;
        if (!user.isAdmin) {
            return res.json({ error: 'Not authorized' });
        }
        
        const orderData = req.loadedOrder;
        const repUser = orderData.user;
        
        const responseOrder = await repUser.createCharge(order.amount, { orderId: orderData.id });

        if (!responseOrder) {
            return res.json({ error: 'Missing Card' });
        }

        if (responseOrder.paid) {
            await prisma.order.update({
                where: { id: orderData.id },
                data: {
                    amount: order.amount,
                    chargeId: responseOrder.id,
                    fillDate: new Date(),
                    filledById: user.id
                }
            });
            return res.json({ success: true });
        } else {
            return res.json({ success: false, message: 'Not Paid' });
        }
    } catch (e) {
        return res.json({ error: e.message });
    }
};

exports.create = async function (req, res, next) {
    const user = req.user;
    const organization = await prisma.organization.findUnique({ where: { userId: user.id } });
    const order = req.body;

    const newOrder = await prisma.order.create({
        data: order,
        include: { status: true }
    });

    await prisma.user.update({
        where: { id: user.id },
        data: { orders: { connect: { id: newOrder.id } } }
    });

    await prisma.organization.update({
        where: { id: organization.id },
        data: { orders: { connect: { id: newOrder.id } } }
    });

    res.json(newOrder);
}

exports.list = async function (req, res, next) {
    const user = req.user;

    if (user.isAdmin) {
        const orders = await prisma.order.findMany({
            orderBy: { id: 'desc' },
            include: { status: true, user: true, type: true }
        });
        res.json(orders);
    } else {
        const userOrders = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
                orders: {
                    orderBy: { id: 'desc' },
                    include: { status: true, type: true }
                }
            }
        });
        const orderCount = userOrders.orders.length;
        res.json({
            rows: userOrders.orders,
            count: orderCount
        });
    }
}

exports.update = async function (req, res, next) {
    const updateData = req.body;
    const loadedOrder = req.loadedOrder;

    const updatedOrder = await prisma.order.update({
        where: { id: loadedOrder.id },
        data: updateData
    });
    
    res.json(updatedOrder);
}

exports.delete = async function (req, res, next) {
    // This function is empty. When implemented, use prisma.order.delete() to remove an order.
}
