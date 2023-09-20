const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.list = async function (req, res, next) {
    const obj_array = await prisma.adder.findMany();
    res.json(obj_array);
};
