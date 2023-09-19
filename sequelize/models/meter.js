const { DataTypes } = require('sequelize');


module.exports = (sequelize) => {
    sequelize.define('meter', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        name: {
            type: DataTypes.STRING
        },
        meterNumber: {
            type: DataTypes.STRING
        },
        accountNumber: {
            type: DataTypes.STRING
        },
        virtkWatts: {
            type: DataTypes.VIRTUAL,
            get() {
                const months = this.data;
                let total = 0;
                if(!months){
                    return 0;
                }
                months.forEach((month)=>{
                    const value = parseFloat(month.value);
                    if(!isNaN(value)){
                        total +=  value
                    }
                });
                return total
            },
            set(value) {
                // throw new Error('Do not try to set the `fullName` value!');
            }
        },
        virtAvgMonthlyBill: {
            type: DataTypes.VIRTUAL,
            get() {
                const months = this.data;
                let total = 0;
                if(!months){
                    return 0;
                }
                months.forEach((month)=>{
                    const bill = parseFloat(month.bill);
                    if(!isNaN(bill)){
                        total +=  bill
                    }
                });
                const avg = total/12;
                return avg.toFixed(2);
            },
            set(value) {
               // throw new Error('Do not try to set the `fullName` value!');
            }
        },
        data: {
            type: DataTypes.JSON
        }
    },{
        createdAt: true,
        updatedAt: true,
    });
};
