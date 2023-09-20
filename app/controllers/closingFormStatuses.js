const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.list = async function (req, res, next) {
    try {
        const data = await prisma.closing_form_status.findMany({
            where: {
                isActive: true
            }
        });
        res.json({ count: data.length, rows: data });
    } catch (error) {
        next(error);
    }
}
