const { DataTypes } = require('sequelize');


module.exports = (sequelize) => {
    sequelize.define('equipment_residential_module', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        length: {
            type: DataTypes.FLOAT
        },
        width: {
            type: DataTypes.FLOAT
        },
        name: {
            type: DataTypes.STRING
        },
        display_name: {
            type: DataTypes.STRING
        },
        wattage: {
            type: DataTypes.FLOAT
        },
        degradation: {
            type: DataTypes.FLOAT
        },
        spec_sheet: {
            type: DataTypes.STRING
        },
        part_number: {
            type: DataTypes.STRING
        },
        ced_part_number: {
            type: DataTypes.STRING
        },
        cad_part_number: {
            type: DataTypes.STRING
        },
        max_power_voltage: {
            type: DataTypes.FLOAT
        },
        max_power_current: {
            type: DataTypes.FLOAT
        },
        open_circuit_voltage: {
            type: DataTypes.FLOAT
        },
        short_circuit_current: {
            type: DataTypes.FLOAT
        },
        ac_module: {
            type: DataTypes.STRING
        },
        dwg_file: {
            type: DataTypes.STRING
        },
        created: {
            type: DataTypes.STRING
        },
        modified: {
            type: DataTypes.STRING
        },
        expired: {
            type: DataTypes.DATE
        },
        cell_quantity: {
            type: DataTypes.INTEGER
        },
        max_fuse_rating: {
            type: DataTypes.INTEGER
        },
        thickness: {
            type: DataTypes.FLOAT
        },
        backsheet_color: {
            type: DataTypes.STRING
        },
        frame_color: {
            type: DataTypes.STRING
        },
        cad_ready: {
            type: DataTypes.BOOLEAN
        },
        weight: {
            type: DataTypes.FLOAT
        },
        spec_images: {
            type: DataTypes.JSON
        },
        use_png_spec: {
            type: DataTypes.BOOLEAN
        },
        manufacturername: {
            type: DataTypes.STRING
        }
    },{
        createdAt: true,
        updatedAt: true,
    });
};


/*

*/
