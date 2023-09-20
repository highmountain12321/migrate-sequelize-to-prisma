const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const _ = require('lodash');

exports.list = async function (req, res, next) {
    try {
        const data = await prisma.document_type.findMany({
            where: {
                isActive: true
            }
        });
        res.json(data);
    } catch (error) {
        console.error(error);
        next(error);
    }
};

exports.create = async function(req, res, next) {
    try {
        if (req.body.id) {
            res.status(400).send(`Bad request: ID should not be provided, since it is determined automatically by the database.`);
        } else {
            const documentType = await prisma.document_type.create({
                data: req.body
            });
            res.json(documentType);
        }
    } catch (error) {
        console.error(error);
        next(error);
    }
};

exports.update = async function (req, res, next) {
    try {
        const id = parseInt(req.params.id, 10);

        await prisma.document_type.update({
            where: { id: id },
            data: req.body
        });

        const updatedDocumentType = await prisma.document_type.findUnique({
            where: { id: id }
        });
        res.status(201).json(updatedDocumentType);
    } catch (error) {
        console.error(error);
        next(error);
    }
};

exports.destroy = async function (req, res, next) {
    try {
        const id = parseInt(req.params.id, 10);
        const response = await prisma.document_type.delete({
            where: { id: id }
        });
        res.json(response);
    } catch (error) {
        console.error(error);
        next(error);
    }
};
