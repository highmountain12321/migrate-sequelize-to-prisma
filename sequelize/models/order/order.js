const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    return sequelize.define('order', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        fillDate: {
            type: DataTypes.DATE
        },
        chargeId: {
            type: DataTypes.STRING
        },
        stripeInvoiceId: {
            type: DataTypes.STRING,
        },
        amount: {
            type: DataTypes.STRING,
        },
        quantity: {
            type: DataTypes.INTEGER,
        },
        note: {
            type: DataTypes.STRING
        }
    },{
        timestamps: true,
        hooks:{
            beforeCreate: async function(mainModel, next) {
                if(!mainModel.statusId){
                    const statusModel = await sequelize.models.order_status.findOne({
                        where: {
                            isDefault: true
                        }
                    });
                    mainModel.statusId = statusModel.id;
                }
                return mainModel;
            }
        }
    });
};
