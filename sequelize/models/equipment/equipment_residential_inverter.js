const { DataTypes } = require('sequelize');


module.exports = (sequelize) => {
    sequelize.define('equipment_residential_inverter', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        display_name:{
            type: DataTypes.STRING
        },
        model: {
            type: DataTypes.STRING
        },
        type: {
            type: DataTypes.STRING
        },
        efficiency: {
            type: DataTypes.STRING
        },
        spec_sheet: {
            type: DataTypes.STRING
        },
        man_part_num: {
            type: DataTypes.STRING
        },
        ced_part_num: {
            type: DataTypes.STRING
        },
        soligent_part_num: {
            type: DataTypes.STRING
        },
        jexpro_num: {
            type: DataTypes.STRING
        },
        rated_ac: {
            type: DataTypes.INTEGER
        },
        max_ac: {
            type: DataTypes.INTEGER
        },
        max_dc_input: {
            type: DataTypes.STRING
        },
        max_connected_panels: {
            type: DataTypes.INTEGER
        },
        number_of_mppt: {
            type: DataTypes.INTEGER
        },
        inputs_per_mppt: {
            type: DataTypes.STRING
        },
        max_input_voltage: {
            type: DataTypes.INTEGER
        },

        max_input_current: {
            type: DataTypes.INTEGER
        },
        max_output_current_v: {
            type: DataTypes.STRING
        },
        min_breaker_rating: {
            type: DataTypes.STRING
        },
        cec_weighted_eff_percent: {
            type: DataTypes.STRING
        },
        nominal_input_voltage: {
            type: DataTypes.STRING
        },
        nominal_dc_input_voltage: {
            type: DataTypes.STRING
        },
        optimizer_max_output_current: {
            type: DataTypes.STRING
        },
        max_string_wattage_size: {
            type: DataTypes.STRING
        },
        under_module_writing: {
            type: DataTypes.STRING
        },
        optimizers: {
            type: DataTypes.STRING
        },
        rated_dc_input_current: {
            type: DataTypes.STRING
        },

        max_string_size: {
            type: DataTypes.STRING
        },
        min_string_size: {
            type: DataTypes.STRING
        },
        max_output_current: {
            type: DataTypes.INTEGER
        },
        created: {
            type: DataTypes.STRING
        },
        modified: {
            type: DataTypes.STRING
        },
        expired: {
            type: DataTypes.STRING
        },


        part_number: {
            type: DataTypes.STRING
        },
        max_input_power: {
            type: DataTypes.INTEGER
        },
        nominal_input_current: {
            type: DataTypes.INTEGER
        },
        max_input_string_size: {
            type: DataTypes.STRING
        },
        max_input_string_quantity: {
            type: DataTypes.STRING
        },

        max_input_string_power: {
            type: DataTypes.STRING
        },
        max_output_voltage: {
            type: DataTypes.INTEGER
        },
        max_output_wattage: {
            type: DataTypes.INTEGER
        },
        min_output: {
            type: DataTypes.STRING
        },
        battery_ready_inverter: {
            type: DataTypes.STRING
        },
        cad_type: {
            type: DataTypes.STRING
        },
        min_modules_per_string: {
            type: DataTypes.INTEGER
        },
        min_mpp_voltage: {
            type: DataTypes.INTEGER
        },
        max_voltage_drop: {
            type: DataTypes.FLOAT
        },
        combo: {
            type: DataTypes.STRING
        },
        auto_select: {
            type: DataTypes.STRING
        },
        use_png_spec: {
            type: DataTypes.STRING
        },
        includes_ev_charger: {
            type: DataTypes.STRING
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
