const { DataTypes } = require('sequelize');

 
module.exports = (sequelize) => {
    sequelize.define('calendar', {
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
        calendarId: {
            type: DataTypes.INTEGER
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            default:true
        }
    },{
        createdAt: true,
        updatedAt: false,
    });
};
