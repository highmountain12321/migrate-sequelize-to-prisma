const { DataTypes } = require('sequelize');

 
module.exports = (sequelize) => {
    sequelize.define('document', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        originalName: {
            type: DataTypes.STRING,
        },
        key: {
            type: DataTypes.STRING,
        },
        externalUpload: {
            type: DataTypes.BOOLEAN,
        },
        tags: {
            allowNull: true,
            type: DataTypes.JSON,
        },
        metadata: {
            allowNull: true,
            type: DataTypes.JSON,
        },
        versionId:{
            allowNull: false,
            type: DataTypes.STRING
        },
        location: {
            allowNull: false,
            type: DataTypes.STRING
        },
        isActive: {
            allowNull: false,
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        order: {
            allowNull: false,
            type: DataTypes.INTEGER,
            defaultValue: 1
        },
        test:{
            type: DataTypes.INTEGER,

        }
    },{
        createdAt: true,
        updatedAt: false,

            hooks:{
                beforeCreate: async (c) => {


                    if (process.env.ENVIRONMENT === 'dev') {
                        c.test = true;
                    }
                }
            }
    });
};
