const { DataTypes } = require('sequelize');

 
module.exports = (sequelize) => {
    return sequelize.define('internal_update', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        note:{
            type: DataTypes.STRING
        },
        group: {
            type: DataTypes.STRING,
            default:'default'
        },
    },{ // don't forget to enable timestamps!
        createdAt: true,
        updatedAt: false,
    });


};
