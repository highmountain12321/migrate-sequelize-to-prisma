const prisma = require('../lib/prisma');

const _ = require('lodash');

exports.create = async function (req, res, next) {
    const userModel = req.userModel;
    const ipAddress = (
        req.headers['cf-connecting-ip'] ||
        req.headers['x-real-ip'] ||
        req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress || ''
    ).split(',');

    try {
        if (ipAddress && ipAddress[0].length > 0) {
            // Assuming `logLocation` is a method in your user model, you'll need to rewrite this logic
            // based on how it's supposed to interact with the database using Prisma.
            await userModel.logLocation(ipAddress[0]);
        }
        res.json({ isOkay: true });
    } catch (error) {
        next(error);
    }
}

exports.list = async function (req, res, next) {
    const limit = req.query.limit || 1000;
    const offset = req.query.offset || 0;

    try {
        const data = await prisma.login.findMany({
            skip: offset,
            take: limit,
            select: {
                ip: true,
                city: true,
                state: true,
                country: true,
                createdAt: true,
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        id: true
                    }
                },
                // If `manager` is another relation in the `login` model, you can include it as follows:
                manager: {
                    select: {
                        firstName: true,
                        lastName: true,
                        id: true
                    }
                }
            },
            orderBy: {
                id: 'desc'
            }
        });

        res.json(data);
    } catch (error) {
        next(error);
    }
}
