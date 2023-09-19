const { DataTypes } = require('sequelize');


module.exports = (sequelize) => {
    const Type =  sequelize.define('partner_type', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        slug: {
            allowNull: false,
            type: DataTypes.STRING,
            unique: true
        },
        name: {
            type: DataTypes.STRING
        },
        description: {
            type: DataTypes.STRING
        },
        isDefault: {
            type: DataTypes.BOOLEAN,
            default:0
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            default:1
        },
        order: {
            type: DataTypes.INTEGER,
            default:1
        }
    },{
        hooks: {
            beforeValidate: (obj) => {
                if(!obj.slug){
                    obj.slug = obj.name.toLowerCase().replace(/ /g,"-");
                }
                if(obj.slug){
                    obj.slug = obj.slug.toLowerCase().replace(/ /g,"-");
                }
            }
        },
        timestamps: true
    });
    return Type;
};
