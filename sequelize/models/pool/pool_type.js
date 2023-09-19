const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    return sequelize.define('pool_type', {
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
        name: {
            type: DataTypes.STRING,
            unique: true
        },
        description: {
            type: DataTypes.STRING
        },
        isDefault: {
            allowNull: false,
            type: DataTypes.BOOLEAN,
            defaultValue: 0
        },
        order: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        }
    },{
        timestamps: false
    });
};
