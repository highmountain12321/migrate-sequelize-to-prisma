const { DataTypes } = require('sequelize');

 
module.exports = (sequelize) => {
    sequelize.define('design_request', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        }
    },{
        timestamps: true
    });
};
