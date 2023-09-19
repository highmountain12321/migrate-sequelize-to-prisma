const { DataTypes } = require('sequelize');



module.exports = (sequelize) => {


    const userGroup = sequelize.define('user_group', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        name: {
            type: DataTypes.STRING,
            unique: true
        },
        description: {
            type: DataTypes.STRING
        },
        picUrl: {
            type: DataTypes.STRING
        },
        isDefault: {
            allowNull: false,
            type: DataTypes.BOOLEAN,
            defaultValue: 0
        },
        order: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        }
    },{
        timestamps: true
    });


    userGroup.prototype.getRepsCount = async function (type,newWhere) {
        const {models} = require('../../index');
        let where = {};
        if(newWhere){
            where = newWhere;
        }

        return this.countUsers({
            isActive:true,
            where,
            include: [
                {

                    required:true,
                    as: "role",
                    model: models.role,
                    attributes: ['slug'],
                    where : {
                        slug:type
                    }
                }]
        });

        return userGroup;
    };

    userGroup.prototype.getContactsCount = async function (contactType, newWhere) {
        const {models} = require('../../index');

        let where = {};
        if(newWhere){
             where = newWhere;
        }
        return this.countContacts({
            isActive:true,
            where:where,
            include: [
                {
                    model: models.contact_type,
                    as: 'type',
                    attributes: ['slug'],
                    where: {
                        slug: contactType
                    }
                }]
        });

        return userGroup;
    };
};
