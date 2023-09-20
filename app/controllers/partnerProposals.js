const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createComment = async function(req, res, next) {
    const { user } = req.token;
    const loadedModel = req.loadedPartnerProposal;
    const newComment = req.body;
    try {
        const newCommentModel = await prisma.closing_form_comment.create({
            data: {
                closingFormId: loadedModel.id,
                comment: newComment.comment,
                userId: user
            }
        });
        res.json(newCommentModel);
    } catch (e) {
        next(e);
    }
}

exports.list = async function(req, res, next) {
    try {
        const partnerProposals = await prisma.partner_proposal.findMany();
        res.json(partnerProposals);
    } catch (e) {
        next(e);
    }
}

exports.show = async function(req, res, next) {
    const id = parseInt(req.params.proposalId, 10);
    try {
        const partnerProposal = await prisma.partner_proposal.findUnique({ where: { id } });
        if (!partnerProposal) {
            return res.status(404).json({ error: 'Partner Proposal not found' });
        }
        res.json(partnerProposal);
    } catch (e) {
        next(e);
    }
}

exports.update = async function(req, res, next) {
    const id = parseInt(req.params.proposalId, 10);
    const body = req.body;
    try {
        const updatedPartnerProposal = await prisma.partner_proposal.update({
            where: { id },
            data: body
        });
        res.status(201).json(updatedPartnerProposal);
    } catch (e) {
        next(e);
    }
}

exports.create = async function(req, res, next) {
    const { user } = req.token;
    const newProposal = req.body;
    newProposal.submittedBy = user;
    try {
        const createdProposal = await prisma.partner_proposal.create({ data: newProposal });
        res.json(createdProposal);
    } catch (e) {
        next(e);
    }
}

exports.destroy = async function(req, res, next) {
    const id = parseInt(req.params.proposalId, 10);
    try {
        const deletedPartnerProposal = await prisma.partner_proposal.delete({ where: { id } });
        res.json(deletedPartnerProposal);
    } catch (e) {
        next(e);
    }
}
