const { DataTypes } = require('sequelize');
const admin = require("firebase-admin");

module.exports = (sequelize) => {
    sequelize.define('resource', {
        id: {

            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        name: {
            type: DataTypes.STRING,
        },
        description: {
            type: DataTypes.STRING,
        },
        content: {
            type: DataTypes.STRING,
        },
        fileName: {
            type: DataTypes.STRING,
        },
        contentType: {
            type: DataTypes.STRING,
        },
        location: {
            type: DataTypes.STRING,
        },
        isResidential: {
            type: DataTypes.BOOLEAN,
            default:true
        },
        test:{
            type: DataTypes.BOOLEAN,

        }
    },{
        createdAt: true,
        updatedAt: true,

        hooks: {
            beforeDestroy: async(instance, options)=>{
                if(instance.fileName) {
                    try {
                        const bucket = admin.storage().bucket(process.env.STORAGE_BUCKET);
                        const path = instance.fileName;
                        await bucket.file(path).delete();
                    }catch(e){
                        console.error(e);
                    }
                }
            },
                beforeCreate: async (c) => {


                    if (process.env.ENVIRONMENT === 'dev') {
                        c.test = true;
                    }
                }
            }
    });
};
