const prisma = require('../lib/prisma');

const { Services } = require('../services');

const _ = require('lodash');

exports.list = async function (req, res, next) {
    try {
        const state = req.query.state;
        const list = await Services.SolarIncentives.getIncentives(state);
        res.json(list);
    } catch (e) {
        console.error(e);
        next(e);
    }
}

exports.show = async function (req, res, next) {
    const id = parseInt(req.params.id, 10);
    const obj_array = await prisma.incentive.findUnique({ where: { id: id } });
    res.json(obj_array);
}

exports.update = async function (req, res, next) {
    const id = parseInt(req.params.id, 10);
    const body = req.body;

    try {
        const updatedIncentive = await prisma.incentive.update({
            where: { id: id },
            data: body
        });
        res.status(201).json(updatedIncentive);
    } catch (error) {
        next(error);
    }
}

exports.create = async function (req, res, next) {
    const { user, role } = req.token;

    const newProposal = {
        ...req.body,
        userId: user,
        submittedBy: user
    };

    try {
        const newProposalModal = await prisma.incentive.create({ data: newProposal });
        res.json(newProposalModal);
    } catch (error) {
        next(error);
    }
}

exports.destroy = async function (req, res, next) {
    try {
        const id = parseInt(req.params.id, 10);
        const response = await prisma.incentive.delete({ where: { id: id } });
        res.json(response);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

