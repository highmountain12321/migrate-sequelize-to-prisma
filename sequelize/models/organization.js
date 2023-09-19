const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
    const object = sequelize.define('organization', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        name: {
            allowNull: false,
            type: DataTypes.STRING,
            unique: false
        },
        description: {
            allowNull: true,
            type: DataTypes.STRING
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        redline: {
            type: DataTypes.FLOAT
        },
        isDefault: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        inActiveDate: {
            type: DataTypes.DATE
        }
    }, {
        timestamps: true
    });
    return object;
};
