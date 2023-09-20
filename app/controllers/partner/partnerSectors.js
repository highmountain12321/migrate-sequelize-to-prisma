const prisma = require('../../lib/prisma');

exports.list = async function (req, res, next) {
    try {
        const partnerSectors = await prisma.partnerSector.findMany({
            orderBy: {
                order: 'asc'
            }
        });
        
        res.json({
            rows: partnerSectors
        });
    } catch (error) {
        next(error);
    }
}
