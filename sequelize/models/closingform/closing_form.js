const { DataTypes } = require('sequelize');


module.exports = (sequelize) => {
    sequelize.define('closing_form', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        resubmitDate: {
            type: DataTypes.DATE
        },
        isApproved:{
            type: DataTypes.BOOLEAN
        },
        isActive:{
            type: DataTypes.BOOLEAN,
            default:'1'
        },
        taxReviewAddon:{
            type: DataTypes.BOOLEAN,
            default:'0'
        },
        dateApproved:{
            type: DataTypes.DATE
        },
        virtName: {
            type: DataTypes.VIRTUAL,
            get() {
                if(this.contact && this.contact.busName){
                    return this.contact.busName;
                }
                if(this.contact && !this.contact.busName){
                    return this.contact.firstName + ' '+ this.contact.lastName;
                }
                return '';
            },
            set(value) {
                throw new Error('Do not try to set the `fullName` value!');
            }
        },
        virtGenType: {
            type: DataTypes.VIRTUAL,
            get() {
                if(this.contact && this.contact.genType){
                    return this.contact.genType.name;

                }
                return '';
            },
            set(value) {
                throw new Error('Do not try to set the `fullName` value!');
            }
        },
        virtReps: {
            type: DataTypes.VIRTUAL,
            get() {
                if(this.contact && this.contact.users){
                    return this.contact.users;

                }
                return [];
            },
            set(value) {
                throw new Error('Do not try to set the `fullName` value!');
            }
        },
        virtPartner: {
            type: DataTypes.VIRTUAL,
            get() {
                if(this.contact && this.contact.partnerProposals){
                    let selectedProposal;
                    if(this.partnerId){
                        selectedProposal  = this.contact.partnerProposals.find(a => a.partner.id === this.partnerId);
                        if(selectedProposal) {
                            return selectedProposal.partner;
                        }
                    }
                    selectedProposal = this.contact.partnerProposals.find(a => a.selectDate);
                    if(!selectedProposal && this.contact.partnerProposals.length > 0){
                        selectedProposal = this.contact.partnerProposals[0];
                    }
                    if(selectedProposal && selectedProposal.partner && selectedProposal.partner.name){
                        return selectedProposal.partner;
                    }

                }
                return {
                    name:'',
                    url:''
                }
            },
            set(value) {
                throw new Error('Do not try to set the `fullName` value!');
            }
        }
    },{
        timestamps: true,
        hooks: {
            beforeCreate: async function(mainModel, next) {
                if(!mainModel.statusId){
                    const closingFormStatusModel = await sequelize.models.closing_form_status.findOne({
                        where: {
                            isDefault: true
                        }
                    });
                    mainModel.statusId = closingFormStatusModel.id;
                }

                return mainModel;

            }
        }
    });
};
