const { DataTypes } = require('sequelize');

 
module.exports = (sequelize) => {
    sequelize.define('role', {
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
        name: {
            type: DataTypes.STRING
        },
        views: {
            type: DataTypes.JSON
        },
        description: {
            type: DataTypes.STRING
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue:true
        },
        isDefault: {
            type: DataTypes.BOOLEAN,
            defaultValue:false
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
        timestamps: false
    });
};
