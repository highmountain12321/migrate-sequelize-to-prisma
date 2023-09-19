const { DataTypes } = require('sequelize');


module.exports = (sequelize) => {
    sequelize.define('property_type', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
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
        order: {
            type: DataTypes.INTEGER,
            default:1
        },
    },{
        timestamps: false
    });
};
