const prisma = require('../../../prisma/client');

exports.list = async function (req, res, next) {
    try {
        const boards = await prisma.projectBoard.findMany();
        res.json(boards);
    } catch (error) {
        next(error);
    }
};

exports.show = async function (req, res, next) {
    try {
        const id = parseInt(req.params.id);
        const board = await prisma.projectBoard.findUnique({ where: { id } });
        if (board) {
            res.json(board);
        } else {
            res.status(404).send('Board not found');
        }
    } catch (error) {
        next(error);
    }
};

exports.update = async function (req, res, next) {
    try {
        const id = parseInt(req.params.id);
        const updatedBoard = await prisma.projectBoard.update({
            where: { id },
            data: req.body
        });
        res.status(201).json(updatedBoard);
    } catch (error) {
        next(error);
    }
};

exports.create = async function (req, res, next) {
    try {
        const newBoard = {
            ...req.body,
            userId: req.token.user
        };
        const createdBoard = await prisma.projectBoard.create({ data: newBoard });
        res.json(createdBoard);
    } catch (error) {
        next(error);
    }
};

exports.destroy = async function (req, res, next) {
    try {
        const id = parseInt(req.params.projectBoardId);
        await prisma.projectBoard.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        console.log(error);
        next(error);
    }
};
