const { DataTypes } = require('sequelize');


module.exports = (sequelize) => {
    sequelize.define('contact_comment', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        comment: {
            type: DataTypes.STRING
        }
    });
};
