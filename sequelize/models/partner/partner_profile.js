const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Obj = sequelize.define('partner', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        email: {
            allowNull: false,
            type: DataTypes.STRING
        },
        name: {
            type: DataTypes.STRING
        },
        description: {
            type: DataTypes.STRING
        },
        websiteUrl: {
            type: DataTypes.STRING
        },
        primaryPhone: {
            type: DataTypes.STRING
        },
        secondaryPhone: {
            type: DataTypes.STRING
        },
        logoUrl: {
            type: DataTypes.STRING
        },
        loginUrl: {
            type: DataTypes.STRING
        },
        isPreferred: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        isActive: {
            allowNull: false,
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        order: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        },
        redline: {
            allowNull: true,
            type: DataTypes.FLOAT
        },
        virtServiceAreaStates: {
            type: DataTypes.VIRTUAL,
            get() {
                if(this.areas){
                    return this.areas.map((f)=>{
                        return f.state
                    })
                }
                return [];
            },
            set(value) {
                throw new Error('Do not try to set the `fullName` value!');
            }
        },
    },{
        timestamps: true,
    });

    Obj.prototype.addSectorsById = async function(ids) {
        const {models} = require("../../index");
        const model = this;
        if(!Array.isArray(ids)){
            ids = [ids];
        }
        for(let i = 0; i < ids.length; i++){
            const sectorId = ids[i];
            const sectorModel = await models.partner_sector.findByPk(sectorId);
            await this.addSector(sectorModel);
        }
    }
    Obj.prototype.removeSectorsById = async function(ids) {
        const {models} = require("../../index");
        const model = this;
        if(!Array.isArray(ids)){
            ids = [ids];
        }
        for(let i = 0; i < ids.length; i++){
            const sectorId = ids[i];
            const sectorModel = await models.partner_sector.findByPk(sectorId);
            await this.addSector(sectorModel);
        }
    }
    return Obj;

};
