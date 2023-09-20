const prisma = require('../lib/prisma');


exports.list = async function (req, res, next) {
    const obj_array = await prisma.state.findMany();
    res.json({ rows: obj_array });
};
