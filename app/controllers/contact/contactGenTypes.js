const prisma = require('../../lib/prisma');

exports.create = async function(req, res, next) {
    if (req.body.id) {
        res.status(400).send(`Bad request: ID should not be provided, since it is determined automatically by the database.`);
    } else {
        const genType = await prisma.gen_type.create({
            data: req.body
        });
        return res.json(genType);
    }
}

exports.update = async function(req, res, next) {
    try {
        const id = req.params.id;

        const updatedGenType = await prisma.gen_type.update({
            where: { id: Number(id) },
            data: req.body
        });

        res.status(201).json(updatedGenType);
    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.destroy = async function(req, res, next) {
    try {
        const id = req.params.id;

        const deletedGenType = await prisma.gen_type.delete({
            where: { id: Number(id) }
        });

        res.json(deletedGenType);
    } catch(e) {
        console.log(e);
        next(e);
    }
}

exports.list = async function(req, res) {
    const data = await prisma.gen_type.findMany({
        where: {
            isActive: true
        }
    });

    res.json({ count: data.length, rows: data });
}
