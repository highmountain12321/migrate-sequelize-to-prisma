const { DataTypes } = require('sequelize');

 
module.exports = (sequelize) => {
    sequelize.define('lender', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        name: {
            type: DataTypes.STRING
        },
        websiteUrl: {
            type: DataTypes.STRING
        },
        primaryPhone: {
            type: DataTypes.STRING
        },
        secondaryPhone: {
            type: DataTypes.STRING
        },
        fax: {
            type: DataTypes.STRING
        },
        description:{
            type: DataTypes.STRING
        },
        email: {
            type: DataTypes.STRING
        },
        logoUrl: {
            type: DataTypes.STRING
        },
        metadata: {
            allowNull: true,
            type: DataTypes.JSON,
        },
        slug: {
            allowNull: true,
            type: DataTypes.STRING,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        isDefault: {
            allowNull: true,
            type: DataTypes.BOOLEAN,
            defaultValue: false
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
        timestamps: false,
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
