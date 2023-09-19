
const {DataTypes, Sequelize} = require('sequelize');

module.exports = (sequelize) => {
    const contactAction = sequelize.define('contact_action_type', {
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
        isDefault: {
            type: DataTypes.BOOLEAN,
            default:false
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            default:true
        },
    }, {
        createdAt: true,
        updatedAt: false,
    });



    return contactAction;
};
