'use strict';

/**
 * Module dependencies.
 */

const { wrap: async } = require('co');
const only = require('only');
const moment = require('moment');
const {Op} = require("sequelize");

const assign = Object.assign;
const { models } = require('../../sequelize');




/**
 * List
 */

exports.list = async function (req, res) {
    try {
        const limit = req.query.limit || 100;
        const offset = req.query.offset || 0;
        const order = req.query.order || 'DESC';

        const { user, role } = req.token;

        const projects = await prisma.project.findMany({
            where: {
                OR: [
                    {
                        partnerUserId: user,
                        isActive: true
                    }
                ]
            },
            select: {
                id: true,
                partnerUserId: true,
                updateId: true,
                contactId: true,
                createdAt: true,
                partnerId: true,
                update: {
                    select: {
                        note: true,
                        createdAt: true,
                        to: {
                            select: {
                                name: true,
                                id: true
                            }
                        }
                    }
                },
                partnerUser: {
                    select: {
                        firstName: true,
                        partnerId: true,
                        partner: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                contact: {
                    select: {
                        primaryPhone: true,
                        firstName: true,
                        lastName: true,
                        address1: true,
                        city: true,
                        state: true,
                        postalCode: true
                    }
                }
            },
            orderBy: {
                id: order.toLowerCase() === 'desc' ? 'desc' : 'asc'
            },
            skip: offset,
            take: limit
        });
        res.json(projects);
    } catch (e) {
        console.error(e);
        res.status(500).send(e.message);
    }
};



exports.count = async function (req, res) {
    try {
        const count = await prisma.partner.count();
        res.json({
            count: count,
        });
    } catch (e) {
        console.error(e);
        res.status(500).send(e.message);
    }
};







exports.create = async function (req, res, next) {
    try {
        const project = req.body;
        project.ownerId = req.userModel.id;
        const newProject = await prisma.project.create({
            data: project
        });
        return res.json(newProject);
    } catch (e) {
        console.error(e);
        res.status(500).send(e.message);
    }
};


exports.update = async function (req, res) {
    try {
        const id = req.params.projectId;
        if (req.body.id) {
            return res.status(400).send(`Bad request: ID should not be provided, since it is determined automatically by the database.`);
        }
        const updatedProject = await prisma.project.update({
            where: { id: Number(id) },
            data: req.body
        });
        res.status(200).json(updatedProject);
    } catch (e) {
        console.error(e);
        res.status(500).send(e.message);
    }
};



exports.show = async function (req, res) {
    try {
        const id = req.params.projectId;
        const project = await prisma.project.findUnique({
            where: { id: Number(id) },
            select: {
                id: true,
                // ... other direct fields you need,
                users: {
                    select: {
                        firstName: true,
                        lastName: true,
                        primaryPhone: true,
                        roleId: true,
                        role: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                update: {
                    select: {
                        note: true,
                        createdAt: true,
                        to: {
                            select: {
                                name: true,
                                id: true
                            }
                        }
                    }
                },
                contact: {
                    select: {
                        id: true,
                        primaryPhone: true,
                        secondaryPhone: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        address1: true,
                        address2: true,
                        city: true,
                        state: true,
                        postalCode: true,
                        partnerProposals: {
                            select: {
                                url: true
                            }
                        },
                        hoa: true
                    }
                }
            }
        });
        res.status(200).json(project);
    } catch (e) {
        console.error(e);
        res.status(500).send(e.message);
    }
};






exports.listTypes = async function (req, res) {
    try {
        const projectUpdateTypes = await prisma.project_update_type.findMany({
            where: {
                isActive: 1,
                isVisible: 1
            },
            orderBy: {
                order: 'asc'
            }
        });
        res.json(projectUpdateTypes);
    } catch (e) {
        console.error(e);
        res.status(500).send(e.message);
    }
};



exports.listDocuments = async function (req, res) {
    try {
        const id = req.params.projectId;
        const project = await prisma.project.findUnique({
            where: { id: Number(id) },
            select: {
                // ... your selected fields and includes
            }
        });
        res.status(200).json(project);
    } catch (e) {
        console.error(e);
        res.status(500).send(e.message);
    }
};



exports.createUpdate = async function (req, res) {
    try {
        const { user, role } = req.token;
        const newUpdate = req.body;
        newUpdate.userId = user;
        if (!newUpdate.toId) {
            return res.json({});
        }
        const createdUpdate = await prisma.project_update.create({
            data: newUpdate
        });
        await prisma.project.update({
            where: { id: createdUpdate.projectId },
            data: { updateId: createdUpdate.id }
        });
        res.json({ ok: true });
    } catch (e) {
        console.error(e);
        res.status(500).send(e.message);
    }
};


exports.listDocuments = async function (req, res) {
    try {
        const id = req.params.projectId;
        const project = await prisma.project.findUnique({
            where: { id: Number(id) },
            select: {
                id: true,
                documents: {
                    select: {
                        originalName: true,
                        id: true,
                        typeId: true,
                        createdAt: true,
                        type: {
                            select: {
                                name: true,
                                slug: true
                            }
                        }
                    }
                }
            }
        });
        res.status(200).json(project);
    } catch (e) {
        console.error(e);
        res.status(500).send(e.message);
    }
};


exports.listUpdates = async function (req, res, next) {
    try {
        const id = req.params.projectId;

        const updates = await prisma.project_update.findMany({
            where: {
                projectId: Number(id)
            },
            select: {
                toId: true,
                createdAt: true,
                note: true,
                user: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                },
                to: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                id: 'desc'
            }
        });
        
        res.status(200).json(updates);
    } catch (e) {
        console.error(e);
        next(e);
    }
};





exports.destroy = async function (req, res, next) {
    try {
        const id = req.params.projectId;

        // First, find the project to ensure it exists
        const project = await prisma.project.findUnique({ 
            where: { id: Number(id) } 
        });

        if (!project) {
            res.status(404).send("Project not found");
            return;
        }

        const response = await prisma.project.delete({
            where: { id: Number(id) }
        });
        
        res.json({ data: response });
    } catch (e) {
        console.error(e);
        next(e);
    }
};



