const { DataTypes } = require('sequelize');


module.exports = (sequelize) => {
    sequelize.define('auto_automation', {
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
        twilioFlowId: {
            type: DataTypes.STRING
        },
        targetUrl: {
            type: DataTypes.STRING
        },
        phoneNumber: {
            type: DataTypes.STRING
        },
        isPrivate: {
            type: DataTypes.BOOLEAN,
            default: 1
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            default: 1
        },
        lastRunDate: {
            type: DataTypes.DATE
        }
    },{
        createdAt: true,
        updatedAt: true,
    });
};
