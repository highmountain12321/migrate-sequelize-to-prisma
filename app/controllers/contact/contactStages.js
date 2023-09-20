const prisma = require('../../lib/prisma');

exports.list = async function (req, res, next) {
    try {
        const data = await prisma.contact_stage.findMany({
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

exports.create = async function (req, res, next) {
    try {
        const { user } = req.token;

        const newProposal = {
            ...req.body,
            userId: user
        };

        const newProposalModal = await prisma.contact_stage.create({
            data: newProposal
        });

        return res.json(newProposalModal);
    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.update = async function (req, res, next) {
    try {
        const id = req.params.id;

        const updatedContactStage = await prisma.contact_stage.update({
            where: { id: Number(id) },
            data: req.body
        });

        res.status(201).json(updatedContactStage);
    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.destroy = async function (req, res, next) {
    try {
        const id = req.params.id;

        const deletedContactStage = await prisma.contact_stage.delete({
            where: { id: Number(id) }
        });

        res.json(deletedContactStage);
    } catch (e) {
        console.log(e);
        next(e);
    }
}
