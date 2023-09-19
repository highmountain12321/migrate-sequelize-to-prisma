const { DataTypes } = require('sequelize');

 
module.exports = (sequelize) => {
    sequelize.define('app_phone', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        phone: {
            type: DataTypes.STRING
        },
        provider: {
            type: DataTypes.STRING
        },
        providerPhoneId: {
            type: DataTypes.STRING
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            default: 1
        }
    },{
        createdAt: true,
        updatedAt: true,
    });
};
