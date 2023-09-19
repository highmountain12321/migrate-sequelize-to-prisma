const {DataTypes} = require('sequelize');

 
module.exports = (sequelize) => {
    sequelize.define('contact_statuses', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        naem: {
            allowNull: false,
            type: DataTypes.DOUBLE,
            unique: false,
        },
        marker_url: {
            allowNull: false,
            type: DataTypes.DOUBLE,
            unique: false,
        }
    }, {
        timestamps: false
    });
};
