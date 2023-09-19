const { DataTypes } = require('sequelize');

 
module.exports = (sequelize) => {
    sequelize.define('contact_event', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        system: {
            type: DataTypes.BOOLEAN
        },
        processDate: {
            type: DataTypes.DATE
        },
        test: {
            type: DataTypes.BOOLEAN,
        },
    },{
        createdAt: true,
        updatedAt: false,
    });
};
