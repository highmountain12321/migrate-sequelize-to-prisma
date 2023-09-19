const { DataTypes } = require('sequelize');

 
module.exports = (sequelize) => {
    sequelize.define('app_email', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        email: {
            type: DataTypes.STRING
        },
        provider: {
            type: DataTypes.STRING
        },
        providerId: {
            type: DataTypes.STRING
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            default: true
        }
    },{
        createdAt: true,
        updatedAt: true,
    });
};
