const { DataTypes } = require('sequelize');

 
module.exports = (sequelize) => {
    sequelize.define('contact_system', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        size: {
            type: DataTypes.INTEGER
        }
    },{
        timestamps: true
    });
};
