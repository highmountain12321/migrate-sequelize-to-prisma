const { DataTypes } = require('sequelize');

 
module.exports = (sequelize) => {
    sequelize.define('closing_form_update_type', {
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
            allowNull: false,
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
        isVisible: {
            type: DataTypes.BOOLEAN,
            default:false
        },
        order: {
            type: DataTypes.INTEGER,
            default:1
        },
        group: {
            type: DataTypes.STRING,
            default:'default'
        },
        section: {
            type: DataTypes.STRING,
            default:'contact'
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
