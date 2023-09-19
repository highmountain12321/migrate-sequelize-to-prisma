const { DataTypes } = require('sequelize');

 
module.exports = (sequelize) => {
    sequelize.define('lender_proposal', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        url: {
            type: DataTypes.STRING,
        },
        loanAmount:{
            type: DataTypes.INTEGER,
        },
        systemPrice:{
            type: DataTypes.INTEGER,
        },
        systemSize:{
            type: DataTypes.INTEGER,
        },
        rate:{
            type: DataTypes.INTEGER,
        },
        months:{
            type: DataTypes.INTEGER,
        },
        years:{
            type: DataTypes.INTEGER,
        },
        isCash: {
            allowNull: true,
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        cashAmount:{
            type: DataTypes.INTEGER,
        },
        ppwGross:{
            type: DataTypes.FLOAT,
        },
        ppwNet:{
            type: DataTypes.FLOAT,
        },
        isActive: {
            allowNull: false,
            type: DataTypes.BOOLEAN,
            unique: false,
            defaultValue: true
        },
        metadata: {
            allowNull: true,
            type: DataTypes.JSON,
        },
        selectDate: {
            type: DataTypes.DATE
        },
    },{
        timestamps: true,

    });
};
