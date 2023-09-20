process.env.BACKBLAZE_BUCKET_ID = '3281e2f2e649281c7bdd0f1a';
const B2 = require('backblaze-b2');
const prisma = require('@prisma/client'); // Make sure to import Prisma client

const b2 = new B2({
    applicationKeyId: '0022122698cbdfa0000000001',
    applicationKey: 'K002dsHoZiBA4MZrb/7KqWJ2tAGWzPY'
});

const _ = require('lodash');

exports.list = async function (req, res, next) {
    const obj_array = await prisma.document.findMany();
    res.json(obj_array);
};

exports.externalCreate = async function (req, res, next) {
    const userId = req.params.userId;
    const contactId = req.params.contactId;
    const typeId = req.body.typeId;
    const projectId = req.body.projectId;
    let partnerId = req.body.partnerId;

    try {
        const doc = await prisma.document.create({
            data: {
                externalUpload: true,
                versionId: 1,
                originalName: req.body.originalName,
                key: req.body.key,
                partnerId,
                userId: userId,
                location: req.body.location,
                projectId,
                contactId,
                typeId
            }
        });
        res.json(doc);
    } catch (e) {
        console.error(e);
        next(e);
    }
};

exports.create = async function (req, res, next) {
    const { user, role } = req.token;
    const userId = user;
    const typeId = req.body.typeId;
    const contactId = req.body.contactId;
    const projectId = req.body.projectId;
    let partnerId = req.body.partnerId;

    const saved = [];

    if (!req.files) {
        return res.json({ message: 'Files are missing' });
    }

    for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        try {
            const doc = await prisma.document.create({
                data: {
                    versionId: file.versionId,
                    originalName: file.originalname,
                    key: file.key,
                    partnerId,
                    userId: userId,
                    location: file.location,
                    projectId,
                    contactId,
                    typeId
                }
            });
            saved.push(doc);
        } catch (e) {
            console.error(e.message);

            await b2.authorize();
            await b2.deleteFileVersion({
                fileName: file.key,
                fileId: file.versionId
            });
        }
    }

    res.json(saved);
};

exports.destroy = async function (req, res, next) {
    const { user, role } = req.token;
    const id = req.params.id;
    const documentModel = await prisma.document.findUnique({
        where: { id: Number(id) }
    });

    if (!documentModel) {
        return next({ message: 'Document not found' });
    }

    if (documentModel.location.indexOf('firebasestorage') > -1) {
        const storage = admin.storage();
        try {
            await storage.bucket(bucket).file(documentModel.key).delete();
        } catch (e) {
            console.error(e);
        }
        await prisma.document.delete({ where: { id: Number(id) } });
        res.json({ delete: true });
    }

    try {
        await b2.authorize();
        await b2.deleteFileVersion({
            fileName: documentModel.key,
            fileId: documentModel.versionId
        });
        await prisma.document.delete({ where: { id: Number(id) } });
        res.json({ delete: true });
    } catch (e) {
        if (e.response && e.response.data.code === 'file_not_present') {
            await prisma.document.delete({ where: { id: Number(id) } });
            return res.json({ delete: true });
        }
        console.error(e.message);
        next({ message: e.message });
    }
};

exports.download = async function (req, res, next) {
    try {
        const id = req.params.id;
        const obj = await prisma.document.findUnique({
            where: { id: Number(id) }
        });

        await b2.authorize();
        const logInb2 = await b2.getDownloadAuthorization({
            bucketId: process.env.BACKBLAZE_BUCKET_ID,
            validDurationInSeconds: 5000,
            fileNamePrefix: obj.key
        });
        let download = await b2.downloadFileById({
            bucketName: process.env.BACKBLAZE_BUCKET_ID,
            fileId: obj.versionId,
            responseType: "stream"
        });

        res.setHeader('Content-Disposition', `attachment; filename=${obj.originalName}`);
        download.data.pipe(res);
    } catch (e) {
        console.error(e.message);
        next(e);
    }
};

exports.tokenDownload = async function (req, res, next) {
    try {
        const id = req.query.documentId;
        const accessToken = req.query.accessToken;

        const obj = await prisma.document.findUnique({
            where: { id: Number(id) }
        });

        await b2.authorize();
        const logInb2 = await b2.getDownloadAuthorization({
            bucketId: process.env.BACKBLAZE_BUCKET_ID,
            validDurationInSeconds: 5000,
            fileNamePrefix: obj.key
        });
        let download = await b2.downloadFileById({
            bucketName: process.env.BACKBLAZE_BUCKET_ID,
            fileId: obj.versionId,
            responseType: "stream"
        });

        res.setHeader('Content-Disposition', `attachment; filename=${obj.originalName}`);
        download.data.pipe(res);
    } catch (e) {
        console.error(e.message);
        next(e);
    }
};
