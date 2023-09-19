const {DataTypes, Sequelize} = require('sequelize');
const moment = require('moment');

 
module.exports = (sequelize) => {
    const contact = sequelize.define('company_contact_temp', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        companyName: {
            type: DataTypes.STRING,
        },
        pocFirstName: {
            type: DataTypes.STRING,
        },
        pocRole: {
            type: DataTypes.STRING,
        },
        pocLastName: {
            type: DataTypes.STRING,
        },
        pocEmail: {
            type: DataTypes.STRING,
        },
        companyWebsite: {
            type: DataTypes.STRING,
        },
        pocPrimaryPhone: {
            type: DataTypes.STRING,
        },
        companyAddress1: {
            type: DataTypes.STRING,
        },
        companyAddress2: {
            type: DataTypes.STRING,
        },
        companyCity: {
            type: DataTypes.STRING,
        },
        companyState: {
            type: DataTypes.STRING,
        },
        companyPostalCode: {
            type: DataTypes.STRING,
        },
        solar: {
            type: DataTypes.BOOLEAN,
        },
        turbine: {
            type: DataTypes.BOOLEAN,
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
        timestamps: true
    });
};
