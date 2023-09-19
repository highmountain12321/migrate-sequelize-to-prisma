const { DataTypes } = require('sequelize');

 
module.exports = (sequelize) => {
    sequelize.define('product_brand', {
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
        websiteUrl: {
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
            defaultValue: true
        },
        metadata: {
            type: DataTypes.JSON,
        },
        isDefault: {
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
        timestamps:false,
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
