const { DataTypes } = require('sequelize');


module.exports = (sequelize) => {
    sequelize.define('state', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        code: {
            type: DataTypes.STRING
        },
        state: {
            type: DataTypes.STRING
        },
        country: {
            type: DataTypes.STRING
        }
    },{
        createdAt: false,
        updatedAt: false,
    });
};
