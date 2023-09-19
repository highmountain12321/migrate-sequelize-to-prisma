const { DataTypes } = require('sequelize');


module.exports = (sequelize) => {
    sequelize.define('app_event_level', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            default:1
        },
        isDefault: {
            type: DataTypes.BOOLEAN,
            default:'0'
        },
        name: {
            type: DataTypes.STRING
        },
        slug: {
            type: DataTypes.STRING
        }
    },{timestamps:false});
};
