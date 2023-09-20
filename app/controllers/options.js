const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const _ = require('lodash');

exports.list = async function (req, res, next) {
    const options = req.query.options;

    if (!options) {
        return next({ message: 'missing options' });
    }

    try {
        const data = await prisma.option.findMany({
            where: {
                type: {
                    in: options.split(',')
                },
                isActive: true,
                isVisible: true
            },
            orderBy: {
                order: 'asc'
            }
        });
        const grouped = _.groupBy(data, 'type');
        res.json(grouped);
    } catch (error) {
        next(error);
    }
}

exports.create = async function(req, res, next) {
    if (req.body.id) {
        res.status(400).send(`Bad request: ID should not be provided, since it is determined automatically by the database.`);
    } else {
        try {
            const option = await prisma.option.create({
                data: req.body
            });
            res.json(option);
        } catch (error) {
            next(error);
        }
    }
}

exports.update = async function(req, res, next) {
    const id = parseInt(req.params.id);

    try {
        const updatedOption = await prisma.option.update({
            where: { id },
            data: req.body
        });
        res.status(201).json(updatedOption);
    } catch (error) {
        next(error);
    }
}

exports.count = async function(req, res, next) {
    try {
        const count = await prisma.option.count();
        res.json({ count });
    } catch (error) {
        next(error);
    }
}

exports.show = async function(req, res, next) {
    const id = parseInt(req.params.partner_id); 

    try {
        const contact = await prisma.contact.findUnique({
            where: { id }
        });
        res.status(200).json({ data: contact });
    } catch (error) {
        next(error);
    }
}

exports.destroy = async function(req, res, next) {
    const id = parseInt(req.params.id);

    try {
        const deletedOption = await prisma.option.delete({
            where: { id }
        });
        res.json({ data: deletedOption });
    } catch (error) {
        console.log(error);
        next(error);
    }
}
