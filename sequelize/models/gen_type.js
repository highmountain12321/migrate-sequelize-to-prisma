const { DataTypes } = require('sequelize');

 
module.exports = (sequelize) => {
    sequelize.define('gen_type', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        slug: {
            allowNull: false,
            type: DataTypes.STRING,
            unique: false
        },
        name: {
            type: DataTypes.STRING
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            default:true
        },
        isDefault: {
            type: DataTypes.BOOLEAN,
            default:false
        },
        description: {
            type: DataTypes.STRING
        },
        order: {
            type: DataTypes.INTEGER,
            default:1
        },
        group: {
            type: DataTypes.STRING,
            default:'default'
        },
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
        timestamps: false
    });
};
