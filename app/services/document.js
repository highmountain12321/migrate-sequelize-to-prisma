process.env.BACKBLAZE_BUCKET_ID = '3281e2f2e649281c7bdd0f1a';
const B2 = require('backblaze-b2');


const b2 = new B2({
    applicationKeyId: '0022122698cbdfa0000000001', // or accountId: 'accountId'
    applicationKey: 'K002dsHoZiBA4MZrb/7KqWJ2tAGWzPY' // or masterApplicationKey
});




exports.delete = async(payload) =>{

    try {

        await b2.authorize(); // must authorize first (authorization lasts 24 hrs)
        await b2.deleteFileVersion({
            fileName:payload.key,
            fileId: payload.versionId,
        });
        return true;
    }catch(e){
        console.error(e.response.data.code );
        if(e.response && e.response.data.code === 'file_not_present'){
            return true;
        }
        console.error(e.message);
        return false;
    }
}
