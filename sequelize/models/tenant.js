const { DataTypes } = require('sequelize');


module.exports = (sequelize) => {
    sequelize.define('tenant', {
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
        description: {
            type: DataTypes.STRING
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            default:'0'
        }
    },{
        createdAt: true,
        updatedAt: true,
    });
};
