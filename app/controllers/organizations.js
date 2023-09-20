const prisma = require('../lib/prisma');

const _ = require('lodash');

exports.list = async function(req, res, next) {
    const { isActive = true } = req.query;
    const organizations = await prisma.organization.findMany({ where: { isActive } });
    res.json(organizations);
}

exports.patchUser = async function(req, res, next) {
    const organizationId = parseInt(req.params.organizationId, 10);
    const obj = req.body;
    let userId = obj.add;
    if (obj.remove) {
        userId = obj.remove;
    }
    try {
        const organizationModel = await prisma.organization.findUnique({ where: { id: organizationId } });
        if (!organizationModel || !organizationModel.isActive) {
            return next({ message: 'Organization not active' });
        }

        const userModel = await prisma.user.findUnique({ where: { id: userId } });
        if (!userModel || !userModel.isActive) {
            return next({ message: 'User not active' });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { organizationId: organizationModel.id }
        });

        const reloadedOrganization = await prisma.organization.findUnique({ where: { id: organizationId } });
        res.status(201).json(reloadedOrganization);
    } catch (e) {
        next({ message: e.message });
    }
}

exports.show = async function(req, res, next) {
    const organizationModel = await prisma.organization.findUnique({ where: { id: req.params.organizationId } });
    res.json(organizationModel);
}

exports.update = async function(req, res, next) {
    const updatedOrganization = await prisma.organization.update({
        where: { id: parseInt(req.params.organizationId, 10) },
        data: req.body
    });
    res.status(201).json(updatedOrganization);
}

exports.create = async function(req, res, next) {
    const newOrganization = await prisma.organization.create({ data: req.body });
    res.json(newOrganization);
}

exports.listUsers = async function(req, res, next) {
    const users = await prisma.user.findMany({
        where: { organizationId: parseInt(req.params.organizationId, 10), isActive: req.query.isActive || true },
        include: { role: true },
        orderBy: { id: 'desc' },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            primaryPhone: true,
            role: { select: { name: true } }
        }
    });
    res.json({ rows: users });
}

exports.listGroups = async function(req, res, next) {
    const groups = await prisma.group.findMany({
        where: { organizationId: parseInt(req.params.organizationId, 10), isActive: req.query.isActive || true },
        orderBy: { id: 'desc' },
        select: { id: true, name: true }
    });
    res.json({ rows: groups });
}

exports.listContacts = async function(req, res, next) {
    const contacts = await prisma.contact.findMany({
        where: { organizationId: parseInt(req.params.organizationId, 10), isActive: req.query.isActive || true },
        include: {
            updates: {
                take: 1,
                orderBy: { id: 'desc' },
                include: { to: true }
            }
        },
        select: {
            createdAt: true,
            id: true,
            firstName: true,
            lastName: true,
            primaryPhone: true,
            email: true,
            name: true,
            busName: true,
            updates: true
        }
    });
    const count = await prisma.contact.count({ where: { organizationId: parseInt(req.params.organizationId, 10), isActive: req.query.isActive || true } });
    res.json({ rows: contacts, count });
}

exports.deleteContact = async function(req, res, next) {
    try {
        const contact = await prisma.contact.update({
            where: { id: parseInt(req.params.contactId, 10) },
            data: { organizationId: (await prisma.organization.findFirst({ where: { isDefault: true } })).id }
        });
        res.json(contact);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

exports.deleteUser = async function(req, res, next) {
    try {
        const user = await prisma.user.update({
            where: { id: parseInt(req.params.userId, 10) },
            data: { organizationId: (await prisma.organization.findFirst({ where: { isDefault: true } })).id }
        });
        res.json(user);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

exports.destroy = async function(req, res, next) {
    try {
        const organization = await prisma.organization.delete({ where: { id: parseInt(req.params.organizationId, 10) } });
        res.json(organization);
    } catch (e) {
        console.log(e);
        next(e);
    }
}
