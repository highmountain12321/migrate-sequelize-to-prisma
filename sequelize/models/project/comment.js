
const {DataTypes, Sequelize} = require('sequelize');

module.exports = (sequelize) => {
    const model = sequelize.define('project_comment', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        contents: {
            type: DataTypes.STRING,
        }
    }, {
        timestamps: true,
        hooks: {
            afterCreate: async (c) => {

            }
        }

    });

    return model;
};
