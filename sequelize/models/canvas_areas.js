const { DataTypes } = require('sequelize');

 
module.exports = (sequelize) => {
    sequelize.define('canvas_areas', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        areas: {
            allowNull: true,
            type: DataTypes.STRING,
            unique: false
        },
        isActive: {
            allowNull: false,
            type: DataTypes.BOOLEAN,
            unique: false,
            defaultValue: true
        },
        group: {
            allowNull: true,
            type: DataTypes.STRING,
            defaultValue: false
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
        timestamps: true
    });
};
