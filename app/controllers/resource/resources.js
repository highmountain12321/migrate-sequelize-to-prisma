const prisma = require('../../lib/prisma');
const B2 = require('backblaze-b2');

const b2 = new B2({
    applicationKeyId: '0022122698cbdfa0000000001',
    applicationKey: 'K002dsHoZiBA4MZrb/7KqWJ2tAGWzPY'
});

exports.list = async function (req, res, next) {
    try {
        const resources = await prisma.resource.findMany();
        res.json({ count: resources.length, rows: resources });
    } catch (error) {
        next(error);
    }
};

exports.update = async function (req, res, next) {
    try {
        const id = parseInt(req.params.resourceId);
        const updatedResource = await prisma.resource.update({
            where: { id },
            data: req.body
        });
        res.status(201).json(updatedResource);
    } catch (error) {
        next(error);
    }
};

exports.show = async function (req, res, next) {
    try {
        const id = parseInt(req.params.resourceId);
        const resource = await prisma.resource.findUnique({
            where: { id }
        });
        res.status(200).json(resource);
    } catch (error) {
        next(error);
    }
};

exports.create = async function (req, res, next) {
    try {
        const { user, role } = req.token;
        const resource = await prisma.resource.create({
            data: {
                name: req.body.name,
                description: req.body.description,
                content: req.body.content,
                userId: user
            }
        });
        res.json(resource);
    } catch (error) {
        next(error);
    }
};

exports.destroy = async function (req, res, next) {
    try {
        const id = parseInt(req.params.resourceId);
        const deletedResource = await prisma.resource.delete({ where: { id } });
        res.json({ delete: true });
    } catch (error) {
        console.log(error);
        next(error);
    }
};

exports.download = async function (req, res, next) {
    // This method largely remains the same as it primarily interacts with backblaze-b2
    // Just the Sequelize specific call is replaced
    try {
        const id = parseInt(req.params.id);
        const resource = await prisma.resource.findUnique({
            where: { id }
        });

        if (!resource) throw new Error('Resource not found.');

        await b2.authorize();
        const logInb2 = await b2.getDownloadAuthorization({
            bucketId: process.env.BACKBLAZE_BUCKET_ID,
            validDurationInSeconds: 5000,
            fileNamePrefix: resource.key
        });
        let download = await b2.downloadFileById({
            bucketName: process.env.BACKBLAZE_BUCKET_ID,
            fileId: resource.versionId,
            responseType: "stream"
        });
        res.setHeader('Content-Disposition', `attachment; filename=${resource.originalName}`);
        download.data.pipe(res);
    } catch (error) {
        console.error(error.message);
        next(error);
    }
};

exports.tokenDownload = async function (req, res, next) {
    // Similarly for tokenDownload, keep the backblaze-b2 specific calls
    // Only replace the Sequelize specific calls
    try {
        const id = parseInt(req.query.id);
        const accessToken = req.query.accessToken;

        const resource = await prisma.resource.findUnique({
            where: { id }
        });

        if (!resource) throw new Error('Resource not found.');

        await b2.authorize();
        const logInb2 = await b2.getDownloadAuthorization({
            bucketId: process.env.BACKBLAZE_BUCKET_ID,
            validDurationInSeconds: 5000,
            fileNamePrefix: resource.key
        });
        let download = await b2.downloadFileById({
            bucketName: process.env.BACKBLAZE_BUCKET_ID,
            fileId: resource.versionId,
            responseType: "stream"
        });
        res.setHeader('Content-Disposition', `attachment; filename=${resource.originalName}`);
        download.data.pipe(res);
    } catch (error) {
        console.error(error.message);
        next(error);
    }
};

