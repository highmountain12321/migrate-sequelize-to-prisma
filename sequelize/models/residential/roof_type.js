const { DataTypes } = require('sequelize');

 
module.exports = (sequelize) => {
    sequelize.define('roof_type', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        slug: {
            type: DataTypes.STRING
        },
        name: {
            type: DataTypes.STRING
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            default:true
        },
        isDefault: {
            type: DataTypes.BOOLEAN,
            default:false
        },
        description: {
            type: DataTypes.STRING
        },
        order: {
            type: DataTypes.INTEGER,
            default:1
        },
        group: {
            type: DataTypes.STRING,
            default:'default'
        },
    },{
        timestamps: false
    });
};
