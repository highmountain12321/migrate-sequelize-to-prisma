const { DataTypes } = require('sequelize');

 
module.exports = (sequelize) => {
    sequelize.define('login', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        ip: {
            type: DataTypes.STRING
        },
        city: {
            type: DataTypes.STRING
        },
        state: {
            type: DataTypes.STRING
        },
        country: {
            type: DataTypes.STRING
        },
        data: {
            type: DataTypes.JSON
        }
    },{
        createdAt: true,
        updatedAt: false,
    });
};
