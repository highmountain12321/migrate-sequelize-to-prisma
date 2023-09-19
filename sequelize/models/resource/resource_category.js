const { DataTypes } = require('sequelize');


module.exports = (sequelize) => {
    sequelize.define('resource_category', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        name: {
            allowNull: false,
            type: DataTypes.STRING
        },
        description: {
            type: DataTypes.STRING
        },
        isResidential: {
            type: DataTypes.BOOLEAN,
            default:false
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
        }
    },{
        hooks: {
        },
        timestamps: false
    });
};
