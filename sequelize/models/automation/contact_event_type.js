const { DataTypes } = require('sequelize');

 
module.exports = (sequelize) => {
    sequelize.define('contact_event_type', {
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
            default: true
        },
        isActionable: {
            type: DataTypes.BOOLEAN,
            default: 'true'
        }
    },{
        createdAt: false,
        updatedAt: false,
    });
};
