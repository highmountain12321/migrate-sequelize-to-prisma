const prisma = require('../lib/prisma');

exports.list = async function (req, res, next) {
    try {
        const { isActive = true } = req.query;

        const apiKeys = await prisma.apiKey.findMany({
            where: {
                isActive: Boolean(isActive)
            },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        id: true,
                        picUrl: true,
                        role: {
                            select: {
                                slug: true
                            }
                        }
                    }
                },
                group: {
                    select: {
                        name: true,
                        id: true
                    }
                }
            }
        });

        res.json(apiKeys);
    } catch (error) {
        next(error);
    }
};

exports.show = async function (req, res, next) {
    try {
        const id = parseInt(req.params.id);
        const apiKey = await prisma.apiKey.findUnique({
            where: { id }
        });
        res.json(apiKey);
    } catch (error) {
        next(error);
    }
};

exports.update = async function (req, res, next) {
    try {
        const id = parseInt(req.params.apiKeyId);
        const updatedApiKey = await prisma.apiKey.update({
            where: { id },
            data: req.body
        });
        res.status(201).json(updatedApiKey);
    } catch (error) {
        next(error);
    }
};

exports.create = async function (req, res, next) {
    try {
        const { user } = req.token;
        const newApiKey = {
            ...req.body,
            userId: user
        };
        const createdApiKey = await prisma.apiKey.create({
            data: newApiKey
        });
        res.json(createdApiKey);
    } catch (error) {
        next(error);
    }
};

exports.destroy = async function (req, res, next) {
    try {
        const id = parseInt(req.params.apiKeyId);
        const deletedApiKey = await prisma.apiKey.delete({
            where: { id }
        });
        res.json(deletedApiKey);
    } catch (error) {
        console.log(error);
        next(error);
    }
};
