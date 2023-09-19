const { DataTypes } = require('sequelize');

 
module.exports = (sequelize) => {
    sequelize.define('product_panel_type', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        name: {
            unique: true,
            allowNull: false,
            type: DataTypes.STRING
        },
        isActive: {
            allowNull: false,
            type: DataTypes.BOOLEAN,
            unique: false,
            defaultValue: true
        }
    },{
    });
};
