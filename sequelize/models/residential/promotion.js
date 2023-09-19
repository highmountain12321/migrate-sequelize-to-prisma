const { DataTypes } = require('sequelize');

 
module.exports = (sequelize) => {
    sequelize.define('promotion', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        content: {
            type: DataTypes.STRING
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            default:true
        },
        description: {
            type: DataTypes.STRING
        },
        order: {
            type: DataTypes.INTEGER,
            default:1
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
        hooks:{
            beforeCreate: async (c) => {


                if (process.env.ENVIRONMENT === 'dev') {
                    c.test = true;
                }
            }
        }
    });
};
