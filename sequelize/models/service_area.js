const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('service_area', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        isPrimary:{
            type: DataTypes.BOOLEAN
        },
        isActive:{
            type: DataTypes.BOOLEAN
        },
        coordinates: {
            type: 'Point', coordinates: [39.807222,-76.984722],
        }
    },{
        timestamps: true
    });

};
