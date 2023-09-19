const {DataTypes, Sequelize} = require('sequelize');
const moment = require('moment');

 
module.exports = (sequelize) => {
    const contact = sequelize.define('poc_role', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        name: {
            type: DataTypes.STRING,
        },
        isDefault: {
            type: DataTypes.BOOLEAN,
            default:false
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            default:true
        },
        order: {
            type: DataTypes.INTEGER,
            default:1
        },
    },{
        timestamps: false
    });
    return contact;
}
