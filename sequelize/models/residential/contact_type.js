const { DataTypes } = require('sequelize');

 
module.exports = (sequelize) => {
   const contactType =  sequelize.define('contact_type', {
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
            default:false
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            default:true
        },
        color: {
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
   return contactType;
};
