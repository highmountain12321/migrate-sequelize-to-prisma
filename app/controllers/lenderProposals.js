const prisma = require('../lib/prisma');


const _ = require('lodash');

exports.list = async function (req, res, next) {
    const objArray = await prisma.lender_proposal.findMany();
    res.json(objArray);
}

exports.show = async function (req, res, next) {
    const id = parseInt(req.params.lenderProposalId, 10);
    const obj = await prisma.lender_proposal.findUnique({ where: { id: id } });
    res.json(obj);
}

exports.update = async function (req, res, next) {
    const id = parseInt(req.params.lenderProposalId, 10);
    const body = req.body;

    try {
        const updatedProposal = await prisma.lender_proposal.update({
            where: { id: id },
            data: body
        });
        res.status(201).json(updatedProposal);
    } catch (error) {
        next(error);
    }
}

exports.create = async function (req, res, next) {
    const { user, role } = req.token;

    const newProposal = {
        ...req.body,
        submittedBy: user
    };

    try {
        const newProposalModel = await prisma.lender_proposal.create({ data: newProposal });
        res.json(newProposalModel);
    } catch (error) {
        next(error);
    }
}

exports.destroy = async function (req, res, next) {
    try {
        const id = parseInt(req.params.lenderProposalId, 10);
        const response = await prisma.lender_proposal.delete({ where: { id: id } });
        res.json(response);
    } catch (e) {
        console.log(e);
        next(e);
    }
}
