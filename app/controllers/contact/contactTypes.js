const { prisma } = require("../../../prisma/client");

exports.list = async function (req, res, next) {
    try {
        const data = await prisma.contact_type.findMany({
            where: {
                isActive: true
            }
        });

        res.json({ rows: data });
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occurred while fetching data.");
    }
}
