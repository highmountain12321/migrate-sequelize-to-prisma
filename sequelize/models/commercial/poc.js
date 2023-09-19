const {DataTypes, Sequelize} = require('sequelize');
const moment = require('moment');

 
module.exports = (sequelize) => {
    const poc = sequelize.define('poc', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        firstName: {
            type: DataTypes.STRING,
        },
        lastName: {
            type: DataTypes.STRING,
        },
        primaryPhone: {
            type: DataTypes.STRING,
        },
        primaryEmail: {
            type: DataTypes.STRING,
        },

        test: {
            type: DataTypes.BOOLEAN
        },
        metadata: {
            type: DataTypes.JSON,
        },
        isActive: {
            allowNull: false,
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            set: function(value) {
                if (value === 'true') value = true;
                if (value === 'false') value = false;
                this.setDataValue('isActive', value);
            }
        },
        group: {
            type: DataTypes.STRING,
            default:'default'
        },

    }, {
        timestamps: true,
        hooks: {
            afterCreate: async (c) => {



            },
            beforeCreate: async (c) => {


                if(process.env.ENVIRONMENT === 'dev'){
                    c.test = true;
                }
                c.firstName = c.firstName.replace(/[^\w\s]/gi, '')
                if (c.primaryEmail) {
                    c.primaryEmail = c.primaryEmail.trim();
                }


            }
        }
    });

    return poc;
};
