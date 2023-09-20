const prisma = require('../lib/prisma');


exports.list = async function (req, res) {
    const list = await prisma.role.findMany();
    res.json(list);
};

exports.show = async function (req, res) {
    const id = parseInt(req.params.id);
    const obj = await prisma.role.findUnique({
        where: {
            id: id,
        },
    });
    res.status(200).json(obj);
};

exports.count = async function (req, res) {
    const count = await prisma.role.count();
    res.json({
        count: count,
    });
};

exports.create = async function (req, res, next) {
    if (req.body.id) {
        res.status(400).send(`Bad request: ID should not be provided, since it is determined automatically by the database.`);
    } else {
        const role = await prisma.role.create({
            data: req.body,
        });
        res.json(role);
    }
};

exports.list_users_by_role = async function (req, res, next) {
    const role_id = parseInt(req.params.id);
    const respo = await prisma.role.findUnique({
        where: {
            id: role_id,
        },
        include: {
            user: true,
        },
    });
    res.json(respo);
};

exports.update = async function (req, res, next) {
    const id = parseInt(req.params.id);
    const body = req.body;
    await prisma.role.update({
        where: {
            id: id,
        },
        data: body,
    });
    const newProposal = await prisma.role.findUnique({
        where: {
            id: id,
        },
    });
    res.status(201).json(newProposal);
};

exports.destroy = async function (req, res, next) {
    try {
        const id = parseInt(req.params.id);
        const response = await prisma.role.delete({
            where: {
                id: id,
            },
        });
        res.json(response);
    } catch (e) {
        console.log(e);
        next(e);
    }
};
