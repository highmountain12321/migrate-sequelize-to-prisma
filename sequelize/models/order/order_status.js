const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    return sequelize.define('order_status', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        isDefault: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        name: {
            type: DataTypes.STRING
        }
    },{
        timestamps: false
    });
};
