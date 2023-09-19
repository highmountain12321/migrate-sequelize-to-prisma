const {DataTypes} = require('sequelize');

 
module.exports = (sequelize) => {
    sequelize.define('canvas_user_areas', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        userId: {
            allowNull: true,
            type: DataTypes.INTEGER,
            unique: false,
        },
        coords: {
            type: DataTypes.JSON,
        }

    }, {
        timestamps: true
    });
};
