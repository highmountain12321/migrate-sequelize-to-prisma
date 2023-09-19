const { DataTypes } = require('sequelize');
const md5 = require('md5');

 
module.exports = (sequelize) => {
    return sequelize.define('zone', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        county: {
            allowNull: true,
            type: DataTypes.STRING
        },
        state: {
            allowNull: true,
            type: DataTypes.STRING
        },
        city: {
            type: DataTypes.STRING
        },
        postalCode: {
            type: DataTypes.STRING
        },
        address1: {
            type: DataTypes.STRING
        },
        address2: {
            type: DataTypes.STRING
        },
        metadata: {
            type: DataTypes.JSON,
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
        timestamps: false
    });

};
