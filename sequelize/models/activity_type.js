const { DataTypes } = require('sequelize');

 
module.exports = (sequelize) => {
    sequelize.define('activity_type', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        slug: {
            type: DataTypes.STRING
        },
        name: {
            type: DataTypes.STRING
        },
        description: {
            type: DataTypes.STRING
        }
    },{
        createdAt: false,
        updatedAt: false,
    });
};
