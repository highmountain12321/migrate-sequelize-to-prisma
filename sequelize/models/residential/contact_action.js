
const {DataTypes, Sequelize} = require('sequelize');
const moment = require('moment-timezone');
const cityTimeZones = require("city-timezones");
const {Services} = require("../../../app/services");

module.exports = (sequelize) => {
    const contactAction = sequelize.define('contact_action', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        }
    }, {
        createdAt: true,
        updatedAt: false,
    });



    return contactAction;
};
