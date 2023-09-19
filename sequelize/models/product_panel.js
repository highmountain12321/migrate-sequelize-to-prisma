const { DataTypes } = require('sequelize');

 
module.exports = (sequelize) => {
    sequelize.define('product_panel', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        imageUrl: {
            type: DataTypes.STRING
        },
        productUrl: {
            type: DataTypes.STRING,
        },
        websiteUrl: {
            type: DataTypes.STRING,
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
        },
        group: {
            type: DataTypes.STRING,
            default:'default'
        },
        nominalPower: {
            type: DataTypes.STRING,
            default:'default'
        },
        length: {
            type: DataTypes.INTEGER,
            default:0
        },
        width: {
            type: DataTypes.INTEGER,
            default:0
        },
        model: {
            type: DataTypes.STRING
        },
        tempCoeff: {
            type: DataTypes.STRING
        },
        NOCT: {
            type: DataTypes.STRING
        },
    },{
    });
};
