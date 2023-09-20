const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.list = async function (req, res, next) {
    const obj_array = await prisma.state.findMany();
    res.json({ rows: obj_array });
};
