const { DataTypes } = require('sequelize');

 
module.exports = (sequelize) => {
    sequelize.define('country', {
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
            allowNull: true,
            type: DataTypes.STRING
        },
        websiteUrl: {
            allowNull: true,
            type: DataTypes.STRING,
            unique: false
        },
        description: {
            allowNull: false,
            type: DataTypes.STRING
        },
        name: {
            allowNull: false,
            type: DataTypes.STRING
        },
        isActive: {
            allowNull: false,
            type: DataTypes.BOOLEAN,
            unique: false,
            defaultValue: true
        },
        metadata: {
            allowNull: true,
            type: DataTypes.JSON,
        },
        group: {
            allowNull: true,
            type: DataTypes.STRING,
            unique: false,
            validate: {
                // We require usernames to have length of at least 3, and
                // only use letters, numbers and underscores.
                is: /[^\W_]/
            }
        },
        isDefault: {
            allowNull: false,
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        isApproved: {
            allowNull: false,
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        order: {
            allowNull: false,
            type: DataTypes.INTEGER,
            defaultValue: 1
        }
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
