const { DataTypes } = require('sequelize');

 
module.exports = (sequelize) => {
    sequelize.define('adder', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        name: {
            type: DataTypes.STRING
        },
        value: {
            type: DataTypes.STRING
        },
        quantity: {
            type: DataTypes.INTEGER
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            default:true
        },
        description: {
            type: DataTypes.STRING
        },
        group: {
            type: DataTypes.STRING,
            default:'default'
        },
        test: {
            type: DataTypes.BOOLEAN
        },
    },{
        createdAt: true,
        updatedAt: false,
        hooks: {

            beforeCreate: async (c) => {


                if (process.env.ENVIRONMENT === 'dev') {
                    c.test = true;
                }
            },
            afterCreate: async (c) => {


            }
        }
    });
};
