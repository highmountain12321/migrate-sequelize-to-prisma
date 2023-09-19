const { DataTypes } = require('sequelize');

 
module.exports = (sequelize) => {
    sequelize.define('task', {
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
            unique: true
        },
        dateCompleted: {
            type: DataTypes.DATE,
        },
        dateAssigned: {
            type: DataTypes.DATE,
        },
        dueDate: {
            type: DataTypes.DATE,
        },
        slug: {
            type: DataTypes.STRING,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true

        },
        group: {
            type: DataTypes.STRING,
        },
        metadata: {
            allowNull: true,
            type: DataTypes.JSON,
        },
        isDefault: {
            allowNull: true,
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        order: {
            allowNull: true,
            type: DataTypes.INTEGER,
            defaultValue: 1
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
