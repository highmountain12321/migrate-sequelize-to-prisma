




process.env.BACKBLAZE_BUCKET_ID = '3281e2f2e649281c7bdd0f1a';
const B2 = require('backblaze-b2');


const b2 = new B2({
    applicationKeyId: '0022122698cbdfa0000000001', // or accountId: 'accountId'
    applicationKey: 'K002dsHoZiBA4MZrb/7KqWJ2tAGWzPY' // or masterApplicationKey
});


const { wrap: async } = require('co');
const { models } = require('../../sequelize');

const _ = require('lodash');

exports.list = async function (req, res, next) {
    const obj_array = await models.document.findAll();
    res.json(obj_array);
}
exports.externalCreate = async function (req, res, next) {


    const userId = req.params.userId;
    const contactId = req.params.contactId;
    const typeId = req.body.typeId;
    const projectId = req.body.projectId;
    let partnerId = req.body.partnerId;




        try {
            const doc = await models.document.create({
                externalUpload:true,
                versionId: 1,
                originalName: req.body.originalName,
                key: req.body.key,
                partnerId,
                userId: userId,
                location: req.body.location,
                projectId,
                contactId,
                typeId
            }, {
                include: [{
                    model: models.document_type,
                    as: 'type',
                    attributes: ['name', 'slug']
                }]
            });
            await doc.save();
            res.json(doc);
        } catch(e){
            console.error(e);
            next(e);
        }


}

exports.create = async function (req, res, next) {

    const {user, role} = req.token;

        const userId = user;
        const typeId = req.body.typeId;
        const contactId = req.body.contactId;
        const projectId = req.body.projectId;
        let partnerId = req.body.partnerId;


        const saved = [];
        if (!req.files) {
            return res.json({message: 'Files are missing'});
        }
        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            try {
                const doc = await models.document.create({
                    versionId: file.versionId,
                    originalName: file.originalname,
                    key: file.key,
                    partnerId,
                    userId: userId,
                    location: file.location,
                    projectId,
                    contactId,
                    typeId
                }, {
                    include: [{
                        model: models.document_type,
                        as: 'type',
                        attributes: ['name', 'slug']
                    }]
                });
                await doc.save();
                saved.push(doc);
            } catch(e){
                console.error(e.message);

                await b2.authorize(); // must authorize first (authorization lasts 24 hrs)
                await b2.deleteFileVersion({
                    fileName:file.key,
                    fileId:  file.versionId,
                    // ...common arguments (optional)
                });

            }
        }

        res.json(saved);

}
exports.destroy = async function (req, res,next) {

    const {user, role} = req.token;

    const id = req.params.id;
    const documentModel = await models.document.findByPk(id);
    if(!documentModel){
        return next({message:'Document not found'});
    }

    if(documentModel.location.indexOf('firebasestorage') > -1) {

        const storage = admin.storage();
        let cc;
        try {
             cc = await storage.bucket(bucket).file(documentModel.key).delete();
        }catch(e){
            console.error(e);
        }
        await documentModel.destroy()
        //const response = await obj.destroy()
        res.json({delete:true});
    }



    try {

        await b2.authorize(); // must authorize first (authorization lasts 24 hrs)
       await b2.deleteFileVersion({
            fileName:documentModel.key,
            fileId: documentModel.versionId,
            // ...common arguments (optional)
        });
        await documentModel.destroy()
        //const response = await obj.destroy()
        res.json({delete:true});
    }catch(e){

        if(e.response && e.response.data.code === 'file_not_present'){
            await documentModel.destroy();
            return res.json({delete:true});
        }
        console.error(e.message);
        next({message: e.message});
    }
}

exports.download = async function (req, res,next) {
    try {
        const id = req.params.id;
        const obj = await models.document.findByPk(id, {raw: true})

        await b2.authorize(); // must authorize first (authorization lasts 24 hrs)

        const logInb2 = await b2.getDownloadAuthorization({
            bucketId: process.env.BACKBLAZE_BUCKET_ID,
            validDurationInSeconds: 5000, // a number from 0 to 604800
            fileNamePrefix: obj.key
        });
        let download = await b2.downloadFileById({
            bucketName: process.env.BACKBLAZE_BUCKET_ID,
            fileId: obj.versionId,
            responseType: "stream", // options are as in axios: 'arraybuffer', 'blob', 'document', 'json', 'text', 'stream'
        });

        res.setHeader('Content-Disposition', `attachment; filename=${obj.originalName}`);
        download.data.pipe(res)
    }catch(e){
        console.error(e.message);
        next(e)
    }

}

exports.tokenDownload = async function (req, res,next) {
    try {
        const id = req.query.documentId;
        const accessToken = req.query.accessToken;


        const obj = await models.document.findByPk(id, {raw: true})

        await b2.authorize(); // must authorize first (authorization lasts 24 hrs)

        const logInb2 = await b2.getDownloadAuthorization({
            bucketId: process.env.BACKBLAZE_BUCKET_ID,
            validDurationInSeconds: 5000, // a number from 0 to 604800
            fileNamePrefix: obj.key
        });
        let download = await b2.downloadFileById({
            bucketName: process.env.BACKBLAZE_BUCKET_ID,
            fileId: obj.versionId,
            responseType: "stream", // options are as in axios: 'arraybuffer', 'blob', 'document', 'json', 'text', 'stream'
        });

        res.setHeader('Content-Disposition', `attachment; filename=${obj.originalName}`);
        download.data.pipe(res)
    }catch(e){
        console.error(e.message);
        next(e)
    }

}

