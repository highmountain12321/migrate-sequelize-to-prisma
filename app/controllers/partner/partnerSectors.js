const prisma = require("../../../prisma/client");

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
