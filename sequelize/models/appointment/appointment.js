const { DataTypes } = require('sequelize');
const moment = require("moment");


module.exports = (sequelize) => {
    return sequelize.define('appointment', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        utcStartDateTime: {
            allowNull: true,
            type: DataTypes.DATE,
        },
        timezoneOffset: {
            allowNull: true,
            type: DataTypes.STRING,
        },
        startDate: {
            allowNull: true,
            type: DataTypes.STRING,
        },
        endDate: {
            allowNull: true,
            type: DataTypes.STRING,
        },
        fromDate: {
            allowNull: true,
            type: DataTypes.DATE,
        },
        toDate: {
            allowNull: true,
            type: DataTypes.DATE,
        },
        metadata: {
            type: DataTypes.JSON,
        },
        cancelledAt:{
            type: DataTypes.DATE
        },
        timezone: {
            type: DataTypes.JSON
        },
        tzOffset: {
            type: DataTypes.INTEGER
        },
        test: {
            type: DataTypes.BOOLEAN
        },
        isActive: {
            allowNull: false,
            type: DataTypes.BOOLEAN,
            defaultValue:true
        },
        group: {
            type: DataTypes.STRING,
            default:'default'
        },
    },{
        createdAt: true,
        updatedAt: false,
        hooks: {
            beforeValidate: async (c) => {
                const {models} = require('../../index');
                c.startDate = moment(c.startDate).format("YYYY-MM-DD HH:mm:ss");
                if (c.timezone && c.timezone.timeValue) {
                    c.timezoneOffset = c.timezone.timeValue
                }
                if (c.typeId) {
                    const appointmentTypeModel = await models.appointment_type.findOne({
                        where: {
                            id: c.typeId,
                            isActive: true
                        }
                    });
                    c.endDate = moment(c.startDate).add(appointmentTypeModel.add,'minutes').format("YYYY-MM-DD HH:mm:ss");
                }



                if (process.env.ENVIRONMENT === 'dev') {
                        c.test = true;
                    }

            }
        }
    });
};
