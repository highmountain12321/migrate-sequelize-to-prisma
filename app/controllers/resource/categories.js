const prisma = require('../../../prisma/client');

exports.list = async function (req, res, next) {
    try {
        const categories = await prisma.resourceCategory.findMany({
            where: {
                isActive: true
            }
        });
        res.json({ count: categories.length, rows: categories });
    } catch (error) {
        next(error);
    }
};

exports.update = async function (req, res, next) {
    try {
        const categories = await prisma.resourceCategory.findMany();
        res.json(categories);
    } catch (error) {
        next(error);
    }
};

exports.create = async function(req, res, next) {
    try {
        if (req.body.id) {
            res.status(400).send(`Bad request: ID should not be provided, since it is determined automatically by the database.`);
        } else {
            const category = await prisma.resourceCategory.create({
                data: req.body
            });
            res.json(category);
        }
    } catch (error) {
        next(error);
    }
};

exports.update = async function (req, res, next) {
    try {
        const id = parseInt(req.params.id);
        const updatedCategory = await prisma.resourceCategory.update({
            where: { id },
            data: req.body
        });
        res.status(201).json(updatedCategory);
    } catch (error) {
        next(error);
    }
};

exports.destroy = async function (req, res, next) {
    try {
        const id = parseInt(req.params.id);
        const deletedCategory = await prisma.resourceCategory.delete({ where: { id } });
        res.json(deletedCategory);
    } catch (error) {
        console.log(error);
        next(error);
    }
};
