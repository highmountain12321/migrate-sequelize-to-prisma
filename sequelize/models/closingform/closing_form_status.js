const { DataTypes } = require('sequelize');


module.exports = (sequelize) => {
    sequelize.define('closing_form_status', {
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
        slug: {
            type: DataTypes.STRING
        },
        isActive:{
            type: DataTypes.BOOLEAN,
            default:1
        },
        isDefault:{
            type: DataTypes.BOOLEAN,
            default:'0'
        }
    });
};
