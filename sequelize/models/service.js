const { DataTypes } = require('sequelize');

 
module.exports = (sequelize) => {
    sequelize.define('service', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        slug: {
            allowNull: false,
            type: DataTypes.STRING,
            unique: true
        },
        imageUrl: {
            type: DataTypes.STRING
        },
        serviceUrl: {
            type: DataTypes.STRING
        },
        websiteUrl: {
            type: DataTypes.STRING
        },
        price: {
            type: DataTypes.FLOAT
        },
        description: {
            type: DataTypes.STRING
        },
        name: {
            type: DataTypes.STRING
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue:true
        },
        metadata: {
            type: DataTypes.JSON,
        },
        group: {
            type: DataTypes.STRING,
            validate: {
                // We require usernames to have length of at least 3, and
                // only use letters, numbers and underscores.
                is: /[^\W_]/
            }
        },
        isDefault: {
            type: DataTypes.BOOLEAN
        },
        isApproved: {
            type: DataTypes.BOOLEAN
        },
        order: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        },

        group: {
            type: DataTypes.STRING,
            default:'default'
        },
    },{
        hooks: {
            beforeValidate: (obj) => {
                if(!obj.slug){
                    obj.slug = obj.name.toLowerCase().replace(/ /g,"-");
                }
                if(obj.slug){
                    obj.slug = obj.slug.toLowerCase().replace(/ /g,"-");
                }
            }
        },
    });
};
