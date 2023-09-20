const prisma = require('../lib/prisma');


exports.list = async function (req, res, next) {
    const obj_array = await prisma.adder.findMany();
    res.json(obj_array);
};
