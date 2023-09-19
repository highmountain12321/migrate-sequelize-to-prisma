const { DataTypes } = require('sequelize');


module.exports = (sequelize) => {
    sequelize.define('option', {
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
            type: DataTypes.STRING,
            validate: {
                // We require usernames to have length of at least 3, and
                // only use letters, numbers and underscores.
                is: /[^\W_]$/
            }
        },
        value: {
            allowNull: true,
            type: DataTypes.STRING,
        },
        options: {
            allowNull: true,
            type: DataTypes.JSON,
        },
        notifications: {
            allowNull: true,
            type: DataTypes.JSON,
        },
        type: {
            allowNull: false,
            type: DataTypes.STRING
        },
        slug: {
            allowNull: false,
            type: DataTypes.STRING,
        },
        group: {
            allowNull: true,
            type: DataTypes.STRING,
        },
        isActive: {
            allowNull: false,
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        isVisible: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        isDefault: {
            allowNull: true,
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        order: {
            allowNull: false,
            type: DataTypes.INTEGER,
            defaultValue: 1
        },
        group: {
            type: DataTypes.STRING,
            default:'default'
        },
    },{
        timestamps: false,
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
    });
};
