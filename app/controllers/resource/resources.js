


process.env.BACKBLAZE_BUCKET_ID = '3281e2f2e649281c7bdd0f1a';
const B2 = require('backblaze-b2');


const b2 = new B2({
    applicationKeyId: '0022122698cbdfa0000000001', // or accountId: 'accountId'
    applicationKey: 'K002dsHoZiBA4MZrb/7KqWJ2tAGWzPY' // or masterApplicationKey
});


const { wrap: async } = require('co');
const { models } = require('../../../sequelize');

const _ = require('lodash');

exports.list = async function (req, res, next) {
    const obj_array = await models.resource.findAndCountAll();
    res.json(obj_array);
}

exports.update = async function (req, res, next) {
    const id = req.params.resourceId;
    const body  = req.body;
    await models.resource.update(body,{
        returning: true,
        plain: true,
        where:
            {
                id:id
            }});
    const newObject = await models.resource.findByPk(id);
    res.status(201).json(newObject);
}
exports.show = async function (req, res, next) {
    const id = req.params.resourceId;
    const obj = await models.resource.findByPk(id);
    res.status(200).json(obj);
}
exports.create = async function (req, res, next) {

    const {user, role} = req.token;

        const userId = user;
        const {name, description, content} = req.body;

    const doc = await models.resource.create({
        name: name,
        content,
        description: description,
        userId: userId
    });


    res.json(doc);

}
exports.destroy = async function (req, res,next) {
    const {user, role} = req.token;
    const id = req.params.resourceId;
    const resourceModel = await models.resource.findByPk(id);
    if(!resourceModel){
        return next({message:'not found'});
    }

    await resourceModel.destroy();
    res.json({delete:true});

}

exports.download = async function (req, res,next) {
    try {
        const id = req.params.id;
        const obj = await models.resource.findByPk(id, {raw: true})

        await b2.authorize(); // must authorize first (authorization lasts 24 hrs)

        const logInb2 = await b2.getDownloadAuthorization({
            bucketId: process.env.BACKBLAZE_BUCKET_ID,
            validDurationInSeconds: 5000, // a number from 0 to 604800
            fileNamePrefix: obj.key
        });
        let download = await b2.downloadFileById({
            bucketName: process.env.BACKBLAZE_BUCKET_ID,
            fileId: obj.versionId,
            responseType: "stream", // options are as in axios: 'arraybuffer', 'blob', 'resource', 'json', 'text', 'stream'
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
        const id = req.query.id;
        const accessToken = req.query.accessToken;


        const obj = await models.resource.findByPk(id, {raw: true})

        await b2.authorize(); // must authorize first (authorization lasts 24 hrs)

        const logInb2 = await b2.getDownloadAuthorization({
            bucketId: process.env.BACKBLAZE_BUCKET_ID,
            validDurationInSeconds: 5000, // a number from 0 to 604800
            fileNamePrefix: obj.key
        });
        let download = await b2.downloadFileById({
            bucketName: process.env.BACKBLAZE_BUCKET_ID,
            fileId: obj.versionId,
            responseType: "stream", // options are as in axios: 'arraybuffer', 'blob', 'resource', 'json', 'text', 'stream'
        });

        res.setHeader('Content-Disposition', `attachment; filename=${obj.originalName}`);
        download.data.pipe(res)
    }catch(e){
        console.error(e.message);
        next(e)
    }

}

