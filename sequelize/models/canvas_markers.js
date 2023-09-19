const { DataTypes } = require('sequelize');

 
module.exports = (sequelize) => {
    sequelize.define('canvas_markers', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        name: {
            allowNull: false,
            type: DataTypes.STRING,
            unique: true
        },
        slug: {
            allowNull: true,
            type: DataTypes.STRING,
            unique: true,
        },
        marker_url: {
            allowNull: false,
            type: DataTypes.STRING,
            unique: true
        },
        isActive: {
            allowNull: false,
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        group: {
            allowNull: true,
            type: DataTypes.STRING
        },
        isDefault: {
            allowNull: true,
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        order: {
            allowNull: true,
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
        timestamps: false
    });
};
