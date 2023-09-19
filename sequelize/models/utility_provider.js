const { DataTypes } = require('sequelize');

 
module.exports = (sequelize) => {
    return sequelize.define('utility_provider', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        name: {
            type: DataTypes.STRING,
        },
        shortName: {
            type: DataTypes.STRING,
        },
        state: {
            type: DataTypes.STRING,
        },
        ratePlans: {
            type: DataTypes.JSON,
        },

    },{ // don't forget to enable timestamps!
        createdAt: false,
        updatedAt: false,
    });


};
