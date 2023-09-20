const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.create = async function(req, res, next) {
    try {
        if (req.body.id) {
            res.status(400).send(`Bad request: ID should not be provided, since it is determined automatically by the database.`);
        } else {
            const closingformtype = await prisma.closing_form_update_type.create({ data: req.body });
            res.json(closingformtype);
        }
    } catch (error) {
        next(error);
    }
}

exports.update = async function(req, res, next) {
    try {
        const id = parseInt(req.params.id);
        const body = req.body;

        const updatedClosingFormType = await prisma.closing_form_update_type.update({
            where: { id: id },
            data: body
        });

        res.status(200).json(updatedClosingFormType);
    } catch (error) {
        next(error);
    }
}

exports.destroy = async function(req, res, next) {
    try {
        const id = parseInt(req.params.id);
        await prisma.closing_form_update_type.delete({
            where: { id: id }
        });
        res.json({ message: "Deleted successfully" });
    } catch (error) {
        next(error);
    }
}

exports.list = async function(req, res, next) {
    try {
        const data = await prisma.closing_form_update_type.findMany({
            where: {
                isActive: true
            }
        });
        res.json({ count: data.length, rows: data });
    } catch (error) {
        next(error);
    }
}
