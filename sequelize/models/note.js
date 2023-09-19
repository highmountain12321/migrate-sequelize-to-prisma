const { DataTypes } = require('sequelize');

 
module.exports = (sequelize) => {
    sequelize.define('note', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        contents: {
            type: DataTypes.STRING
        },
        test:{
            type: DataTypes.BOOLEAN
        }
    },{
        createdAt: true,
        updatedAt: true,
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
