const { DataTypes } = require('sequelize');

 
module.exports = (sequelize) => {
    sequelize.define('integration', {
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
        providerProfileId: {
            type: DataTypes.STRING
        },
        accessToken: {
            type: DataTypes.STRING
        },
        refreshToken: {
            type: DataTypes.STRING
        },
        profile: {
            type: DataTypes.JSON
        },
        meta: {
            type: DataTypes.JSON
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            default:true
        }
    },{
        createdAt: true,
        updatedAt: false,
    });
};
