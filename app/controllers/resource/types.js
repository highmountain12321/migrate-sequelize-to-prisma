const prisma = require('../../../prisma/client');

exports.list = async function (req, res, next) {
    try {
        const documentTypes = await prisma.resourceDocumentType.findMany({
            where: {
                isActive: true
            }
        });
        res.json(documentTypes);
    } catch (error) {
        next(error);
    }
};

exports.create = async function (req, res, next) {
    try {
        if (req.body.id) {
            res.status(400).send(`Bad request: ID should not be provided, since it is determined automatically by the database.`);
        } else {
            const documentType = await prisma.resourceDocumentType.create({
                data: req.body
            });
            res.json(documentType);
        }
    } catch (error) {
        next(error);
    }
};

exports.update = async function (req, res, next) {
    try {
        const id = parseInt(req.params.id);
        const updatedDocumentType = await prisma.resourceDocumentType.update({
            where: { id },
            data: req.body
        });
        res.status(201).json(updatedDocumentType);
    } catch (error) {
        next(error);
    }
};

exports.destroy = async function (req, res, next) {
    try {
        const id = parseInt(req.params.id);
        const deletedDocumentType = await prisma.resourceDocumentType.delete({
            where: { id }
        });
        res.json(deletedDocumentType);
    } catch (error) {
        console.log(error);
        next(error);
    }
};
