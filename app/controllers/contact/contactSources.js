const { prisma } = require("../../../prisma/client");

exports.list = async function (req, res) {
    try {
        const data = await prisma.contact_source.findMany({
            where: {
                isActive: true
            }
        });
        
        res.json({ count: data.length, rows: data });
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

        const newProposalModal = await prisma.contact_source.create({
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

        const updatedContactSource = await prisma.contact_source.update({
            where: { id: Number(id) },
            data: req.body
        });

        res.status(201).json(updatedContactSource);
    } catch (error) {
        console.log(error);
        next(error);
    }
}

exports.destroy = async function (req, res, next) {
    try {
        const id = req.params.id;

        const deletedContactSource = await prisma.contact_source.delete({
            where: { id: Number(id) }
        });

        res.json(deletedContactSource);
    } catch (e) {
        console.log(e);
        next(e);
    }
}
