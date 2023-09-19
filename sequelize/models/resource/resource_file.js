const { DataTypes } = require('sequelize');


module.exports = (sequelize) => {
    sequelize.define('resource_file', {
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
        description: {
            type: DataTypes.STRING,
        },
        location: {
            allowNull: false,
            type: DataTypes.STRING
        },
        isResidential: {
            type: DataTypes.BOOLEAN,
            default:true
        },
        test:{
            type: DataTypes.BOOLEAN,

        }
    },{
        createdAt: true,
        updatedAt: false,

            hooks:{
                beforeCreate: async (c) => {


                    if (process.env.ENVIRONMENT === 'dev') {
                        c.test = true;
                    }
                }
            }
    });
};
