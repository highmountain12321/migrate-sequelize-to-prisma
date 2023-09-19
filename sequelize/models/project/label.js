
const {DataTypes, Sequelize} = require('sequelize');

module.exports = (sequelize) => {
    const model = sequelize.define('project_label', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        name: {
            type: DataTypes.STRING,
        },
        color: {
            type: DataTypes.STRING,
        },
        isActive: {
            allowNull: false,
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }

    }, {
        timestamps: false,
        hooks: {
            afterCreate: async (c) => {

            }
        }

    });

    return model;
};
