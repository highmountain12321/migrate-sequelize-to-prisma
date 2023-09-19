const {DataTypes} = require('sequelize');

 
module.exports = (sequelize) => {
    sequelize.define('canvas_area_coords', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        lat: {
            allowNull: false,
            type: DataTypes.DOUBLE,
            unique: false,
        },
        lng: {
            allowNull: false,
            type: DataTypes.DOUBLE,
            unique: false,
        },
        canvas_user_area_id: {
            allowNull: true,
            type: DataTypes.INTEGER,
            unique: false,
        },
    }, {
        timestamps: true
    });
};
