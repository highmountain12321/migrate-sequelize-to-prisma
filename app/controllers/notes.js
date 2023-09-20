const prisma = require('../lib/prisma');

const _ = require('lodash');

exports.list = async function (req, res, next) {
    try {
        const notes = await prisma.note.findMany();
        res.json({ data: notes });
    } catch (error) {
        next(error);
    }
}

exports.fetch = async function (req, res, next) {
    const id = parseInt(req.params.id);

    try {
        const note = await prisma.note.findUnique({
            where: { id }
        });
        res.status(200).json({ data: note });
    } catch (error) {
        next(error);
    }
}

exports.count = async function (req, res, next) {
    try {
        const count = await prisma.note.count();
        res.json({ count });
    } catch (error) {
        next(error);
    }
}

exports.create = async function (req, res, next) {
    const { user, role } = req.token;

    try {
        if (req.body.id) {
            res.status(400).send(`Bad request: ID should not be provided, since it is determined automatically by the database.`);
        } else {
            const note = await prisma.note.create({
                data: {
                    ...req.body,
                    userId: user
                },
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            });
            res.status(201).json(note);
        }
    } catch (error) {
        next(error);
    }
}

exports.update = async function (req, res, next) {
    const id = parseInt(req.params.id);

    try {
        if (req.body.id) {
            delete req.body.id;
        }
        const updatedNote = await prisma.note.update({
            where: { id },
            data: req.body
        });
        res.status(201).json({ data: updatedNote });
    } catch (error) {
        next(error);
    }
}

exports.destroy = async function (req, res, next) {
    const id = parseInt(req.params.id);

    try {
        const deletedNote = await prisma.note.delete({
            where: { id }
        });
        res.json({ data: deletedNote });
    } catch (error) {
        console.log(error);
        next(error);
    }
}
