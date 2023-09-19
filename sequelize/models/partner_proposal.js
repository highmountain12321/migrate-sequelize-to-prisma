const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    sequelize.define('partner_proposal', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        url: {
            allowNull: true,
            type: DataTypes.STRING,
            unique: false
        },
        selectDate: {
            allowNull: true,
            type: DataTypes.DATE,
        },
        test: {
            type: DataTypes.BOOLEAN,
        },
        isActive: {
            allowNull: false,
            type: DataTypes.BOOLEAN,
            defaultValue: 1
        },
        metadata: {
            allowNull: true,
            type: DataTypes.JSON,
        },
        group: {
            type: DataTypes.STRING,
            default:'default'
        },
    },{
        timestamps: true
    });
};
