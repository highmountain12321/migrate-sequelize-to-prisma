const prisma = require('../../lib/prisma');

exports.list = async function (req, res, next) {
    try {
        const partnerTypes = await prisma.partnerType.findMany({
            orderBy: {
                order: 'asc'
            }
        });
        
        res.json({
            rows: partnerTypes
        });
    } catch (error) {
        next(error);
    }
}
