const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    sequelize.define('app_event', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        isDismissed: {
            type: DataTypes.BOOLEAN
        },
        comment: {
            type: DataTypes.STRING
        }
    },{
        createdAt: true, // don't add createdAt attribute
        updatedAt: false,
    });
};

