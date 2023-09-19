
const {DataTypes, Sequelize} = require('sequelize');
const moment = require('moment-timezone');
const cityTimeZones = require("city-timezones");
const {Services} = require("../../../app/services");

module.exports = (sequelize) => {
    const {models} = require("../../index");


    const contact = sequelize.define('contact', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        busName: {
            type: DataTypes.STRING,
        },
        busWebsite: {
            type: DataTypes.STRING,
        },
        firstName: {
            type: DataTypes.STRING,
        },
        lastName: {
            type: DataTypes.STRING,
        },
        address1: {
            type: DataTypes.STRING,
        },
        address2: {
            type: DataTypes.STRING,
        },
        city: {
            type: DataTypes.STRING,
        },
        state: {
            type: DataTypes.STRING,
        },
        postalCode: {
            type: DataTypes.STRING,
        },
        interests: {
            type: DataTypes.JSON,
        },
        tzOffset: {
            type: DataTypes.STRING,
        },
        isSpanishSpeaker: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        primaryPhone: {
            type: DataTypes.STRING,
        },
        secondaryPhone: {
            type: DataTypes.STRING
        },
        email: {
            type: DataTypes.STRING,
        },
        utilityProvider: {
            type: DataTypes.STRING,
        },
        avgMonthlyBill: {
            type: DataTypes.STRING,
            set: function(e){
                if(e) {
                    const a = e.toString().replace(/[^0-9.\-]/g, '');
                    this.setDataValue('avgMonthlyBill', a);
                }else {
                    this.setDataValue('avgMonthlyBill', e);
                }
            }
        },
        closeDate: {
            type: DataTypes.DATE,
        },
        leadDate: {
            type: DataTypes.DATE
        },
        opportunityDate: {
            type: DataTypes.DATE,
        },
        sitDate: {
            type: DataTypes.DATE,
        },
        dropDate: {
            type: DataTypes.DATE,
        },
        test: {
            type: DataTypes.BOOLEAN
        },
        isActive: {
            allowNull: false,
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        meta: {
            type: DataTypes.JSON
        },
        sourceNotes: {
            type: DataTypes.TEXT
        },
        name: {
            type: DataTypes.VIRTUAL,
            get() {
                if (!this.busName) {
                    return `${this.firstName} ${this.lastName}`;
                } else {
                    return `${this.busName}`;
                }
            },
            set(value) {
                throw new Error('Do not try to set the `full_address` value!');
            }
        },
        fullAddress: {
            type: DataTypes.VIRTUAL,
            get() {
                if (this.address1 && this.city && this.state && this.postalCode) {
                    return `${this.address1},${this.city},${this.state},${this.postalCode}`;
                } else {
                    return false;
                }
            },
            set(value) {
                throw new Error('Do not try to set the `full_address` value!');
            }
        }
    }, {
        timestamps: true,
        hooks: {
            afterCreate: async (c) => {
                const {Automation} = require('../../../app/services/index').Services;

                if(c.busName){
                    await Automation.runAutomations(2, c);
                }else{
                    await Automation.runAutomations(1, c);
                }
                /*
                const userModel = await c.getUser1();
                const userRole = await userModel.getRole();

                const genTypes = await sequelize.models.gen_type.findAll({
                    raw: true,
                    where: {
                        'isActive': true
                    }
                });

                let genType = genTypes.find(l => l.slug === 'company');
                if (userRole.slug === 'setter') {
                    genType = genTypes.find(l => l.slug === 'setter');
                }
                if (userRole.slug === 'closer') {
                    genType = genTypes.find(l => l.slug === 'self-gen');
                }
                c.genTypeId = genType.id;

                const contactTypeModel = await sequelize.models.contact_type.findOne({
                    where: {
                        'isDefault': true
                    }
                });
                c.typeId = contactTypeModel.id;

                await c.save();
                return c.reload();

                 */

            },
            beforeCreate: async (c) => {

                if(c.city && c.city.indexOf('+') > -1){
                    c.city = c.city.replace(/[^a-z0-9]+|\s+/gmi, " ");
                }




                function getNormalizedUtcOffset(timezone){
                    const momentTimezone = moment.tz(timezone);
                    if (!momentTimezone) {
                        return null;
                    }
                    let offset = momentTimezone.utcOffset();
                    if (momentTimezone.isDST()) {
                        // utcOffset will return the offset normalized by DST. If the location
                        // is in daylight saving time now, it will be adjusted for that. This is
                        // a NAIVE attempt to normalize that by going back 1 hour
                        //offset -= 60;
                    }
                    return offset/60;
                }

                function getUtcOffsetForLocation(location){
                    const timezones = cityTimeZones.findFromCityStateProvince(location);
                    if (timezones && timezones.length) {
                        // timezones will contain an array of all timezones for all cities inside
                        // the given location. For example, if location is a country, this will contain
                        // all timezones of all cities inside the country.
                        // YOU SHOULD CACHE THE RESULT OF THIS FUNCTION.
                        const offsetSet = new Set();
                        for (let timezone of timezones) {
                            const offset = getNormalizedUtcOffset(timezone.timezone);
                            if (offset !== null) {
                                offsetSet.add(offset);
                            }
                        }

                        return [...offsetSet].sort((a, b) => a - b);
                    }
                    return null;
                }




                if(c.city && c.state && !c.tzOffset){
                    const timezone = getUtcOffsetForLocation(`${c.city} ${c.state}`);
                    if(timezone && timezone.length > 0){
                        const n = timezone[0];
                        c.tzOffset =  n;
                    }
                }

                if(!c.stageId) {
                    const contactStageModel = await sequelize.models.contact_stage.findOne({
                        where: {
                            'isDefault': true
                        }
                    });
                    c.stageId = contactStageModel.id;
                }
                if(!c.propertyTypeId) {
                    if(c.busName){
                        c.propertyTypeId = 2;
                    }else{
                        c.propertyTypeId = 1;
                    }
                }


                if(process.env.ENVIRONMENT === 'dev'){
                    c.test = true;
                }
                c.leadDate = Date.now();

                if(c.firstName) {
                    c.firstName = c.firstName.replace(/[^\w\s]/gi, '');
                }
                if(c.lastName) {
                    c.lastName = c.lastName.replace(/[^\w\s]/gi, '')
                }
                if (c.email) {
                    c.email = c.email.trim();
                }
                if (c.state) {
                    c.state = c.state.toUpperCase();
                }
                if (c.primaryPhone) {
                    c.primaryPhone = c.primaryPhone.toString().replace(/\D/g, "");
                }

                if(c.busName){
                    /// commercial
                    c.propertyTypeId = 2;
                }else{
                    /// residential
                    c.propertyTypeId = 1;

                }


            }
        },
        scopes: {
            proposalDetails: {
                include:[{
                    model: sequelize.models.document,
                    include:[{
                        model: sequelize.models.document_type,
                    }],
                }],
                attributes:['avgMonthlyBill','utilityProvider','firstName','lastName','address1','address2','city','state','postalCode','busName']

            }
        }
    });



    const stageModel = require("./contact_stage.js")(sequelize, Sequelize);


    contact.addScope('defaultScope', {
        include: [{
            required: false,
            attributes: ['id', 'name','slug'],
            as: 'stage',
            model: stageModel
        }]
    });


    contact.addScope('basic', {
        where: {
            isActive: true
        },
        attributes:['id','name','leadDate','opportunityDate','busName','firstName','lastName','email','primaryPhone','organizationId','sourceId']
    });
    contact.addScope('export', {
        where: {
            isActive: true
        },
        attributes:['createdAt','id','name','leadDate','opportunityDate','busName','firstName','lastName','email','primaryPhone','organizationId','sourceId','address1','city','state','postalCode']
    });



    contact.prototype.runAutomation = async function(automationId, options = {}) {
        const {Automation} = require('../../../app/services/index').Services;
        await Automation.runAutomation(automationId, this, options);
    }
    contact.prototype.getAvailablePartners = async function() {
        const partners = await sequelize.models.zone.findAll(
            {
                where: {
                    state:this.state
                },
                attributes:['id'],
                include:[{
                    model: sequelize.models.partner,
                    attributes:['name','id'],
                    as: "partner",
                    where: {
                        isActive: true
                    }
                },
                ]
            }
        );
        return partners.map(f => f.partner);
    }

    contact.prototype.returnLead = async function(note) {

        await Services.Benepath.return(this.email, note);
        await Services.Slack.returnLead({
            "blocks": [
                {
                    "type": "divider"
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": ` \n
                       *Returned* : ${this.email} \n *Note* : ${note} \n`
                    }
                },

                {
                    "type": "divider"
                }
            ]
        });

    }

    contact.prototype.requestDesignForUser = async function(userID) {
        const contactModel = this;
        if(contactModel.busName){
            return Promise.resolve(true);
        }

        const userModel = await sequelize.models.user.findByPk(userID,{
            include:[{
                model: sequelize.models.role,
                as:'role'
            }]});


        const finalUrl = `${process.env.FRONTEND_URL}/public/proposal-form?contactId=${contactModel.id}`;
        const name = contactModel.busName ? `*Business:* ${contactModel.busName}` : `*Homeowner:*  ${contactModel.firstName} ${contactModel.lastName}`;


        await Services.Slack.send({
            "blocks": [
                {
                    "type": "divider"
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": ` \n
                         ${name} (${contactModel.id}) \n *avg Monthly Bill:* ${contactModel.avgMonthlyBill} \n *Utility Provider:* ${contactModel.utilityProvider} \n *Address:*  ${contactModel.fullAddress} \n *Requested By:*  ${userModel.firstName}  ${userModel.lastName}  (${userModel.id} / ${userModel.role.name}) \n *login:* ${finalUrl}`
                    }
                },
                {
                    "type": "divider"
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": `*Form:* ${finalUrl}`
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "Add Proposals"
                    },
                    "accessory": {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "Form",
                            "emoji": true
                        },
                        "value": "click_me_123",
                        "url": finalUrl,
                        "action_id": "button-action"
                    }
                }
            ]
        });
    };







    contact.prototype.setDrop = async function(){

    };
    contact.prototype.setLead = async function() {
        const stageModel = await sequelize.models.contact_stage.findOne({
            where: {
                slug:'lead'
            }
        });
        this.stageId = stageModel.id;
        return this.save()
    };
    contact.prototype.setOpportunity = async function() {
        const stageModel = await sequelize.models.contact_stage.findOne({
            where: {
                slug:'opportunity'
            }
        });
        this.stageId = stageModel.id;
        return this.save();
    };


    contact.prototype.setClosed = async function() {

        /*
        const stageModel = await sequelize.models.contact_stage.findOne({
            where: {
                slug:'closed'
            }
        });
        this.stageId = stageModel.id;

        return this.save();

         */
    };




    return contact;
};
