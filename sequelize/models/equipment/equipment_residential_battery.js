const { DataTypes } = require('sequelize');


module.exports = (sequelize) => {
    sequelize.define('equipment_residential_battery', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        part_number: {
            type: DataTypes.STRING
        },
        spec_sheet: {
            type: DataTypes.STRING
        },
        usable_energy: {
            type: DataTypes.STRING
        },
        charge_power: {
            type: DataTypes.STRING
        },
        discharge_power: {
            type: DataTypes.STRING
        },
        peak_discharge_power: {
            type: DataTypes.STRING
        },
        peak_discharge_duration: {
            type: DataTypes.STRING
        },
        product_image_path: {
            type: DataTypes.STRING
        },
    },{
        createdAt: false,
        updatedAt: false,
    });
};


/*

*/
