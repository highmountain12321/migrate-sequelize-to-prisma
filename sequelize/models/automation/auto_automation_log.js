const { DataTypes } = require('sequelize');


module.exports = (sequelize) => {
    sequelize.define('auto_automation_log', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        log: {
            type: DataTypes.STRING
        },
        isError: {
            type: DataTypes.BOOLEAN
        }
    },{
        createdAt: true,
        updatedAt: false,
    });
};
