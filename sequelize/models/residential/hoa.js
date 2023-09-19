const { DataTypes } = require('sequelize');

 
module.exports = (sequelize) => {
    sequelize.define('hoa', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        websiteUrl: {
            type: DataTypes.STRING
        },
        name: {
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
        email: {
            type: DataTypes.STRING
        },
        address1: {
            type: DataTypes.STRING
        },
        address2: {
            type: DataTypes.STRING
        },
        city: {
            type: DataTypes.STRING
        },
        state: {
            type: DataTypes.STRING
        },
        postalCode: {
            type: DataTypes.STRING
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        metadata: {
            type: DataTypes.JSON,
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
