const { DataTypes } = require('sequelize');
const md5 = require('md5');
const jwt = require("jsonwebtoken");
const admin = require("firebase-admin");
const {default: axios} = require("axios");
const {Services} = require("../../../app/services");

module.exports = (sequelize) => {
    const {models} = require("../../index");


    const User = sequelize.define('user', {
        // The following specification of the 'id' attribute could be omitted
        // since it is the default.
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        fid: {
            type: DataTypes.STRING,
            unique: true
        },
        stripeCustomerId: {
            type: DataTypes.STRING,
            unique: true
        },
        email: {
            allowNull: false,
            type: DataTypes.STRING,
            unique: true
        },
        password: {
            allowNull: true,
            type: DataTypes.STRING
        },
        firstName: {
            allowNull: false,
            type: DataTypes.STRING,
            unique: false
        },
        lastName: {
            allowNull: true,
            type: DataTypes.STRING
        },
        primaryPhone: {
            allowNull: true,
            type: DataTypes.STRING
        },
        picUrl: {
            allowNull: true,
            type: DataTypes.STRING
        },
        passwordHash: {
            allowNull: true,
            type: DataTypes.STRING,
            unique: false
        },
        isSpanishSpeaker: {
            allowNull: false,
            type: DataTypes.BOOLEAN,
            defaultValue:false
        },
        isManager: {
            allowNull: false,
            type: DataTypes.BOOLEAN,
            defaultValue:false
        },
        lastLoginDate: {
            allowNull: true,
            type: DataTypes.DATE
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        inActiveDate: {
            type: DataTypes.DATE
        },
        timezone: {
            allowNull: true,
            type: DataTypes.JSON,
        },
        notifications: {
            allowNull: true,
            type: DataTypes.JSON,
        }
    },{
        timestamps: true,
        hooks: {
            afterCreate: async(userObject)=>{

                const {Automation} = require('../../../app/services/index').Services;
                try {
                    await Automation.runAutomations(3, userObject);



                }catch(e){
                    console.error(`Automation Failed (3)`, e)
                }

            },
            beforeValidate: async (user) => {
                // tslint:disable-next-line:no-shadowed-variable
                const {models} = require('../../index');

                /// Ad Rolle
                try {
                    if(!user.roleId) {
                        const role = await models.role.findOne({where: {isDefault: true}});
                        if(!role){
                            throw new Error('Missing default role');
                        }
                        user.roleId = role.id;
                    }
                } catch (err) {
                    throw err;
                }

                /// Add Organization
                try{
                    if(!user.organizationId) {
                        const defaultOrganization = await models.organization.findOne({where: {isDefault: true}});
                        if (defaultOrganization) {
                            user.organizationId = defaultOrganization.id;
                        }
                    }
                }catch(e){
                    console.error(e);
                }

                user.email = user.email.toLowerCase();

            }
        }
    });





    /// used for login as
    User.prototype.getFirebaseAuthToken = async function(){
        try {
            if (!this.fid) {
                return new Error('Missing firebase ID');
            }
            console.log('creating custom token')
            const token = await admin.auth().createCustomToken(this.fid);
            return token;
        }catch(e){
            throw e;
        }
    }

    User.prototype.logLocation = async function(ipAddress) {
        let locationData = {};
        if(process.env.ENVIRONMENT === 'development'){
            return Promise.resolve();
        }
        let save = {
            userId:this.id,
            ip: ipAddress.trim()
        }
        try {
            if(ipAddress) {
                const ip =  await axios.get(`https://ipapi.co/${ipAddress}/json/`);
                locationData = ip.data;
                save.city = locationData.city;
                save.state = locationData.region;
                save.country = locationData.country_name;
            }
        }catch(e){
            console.error(e);
        }
       return sequelize.models.login.create(save);
    };



    User.prototype.sendEmail = async function({templateName,parameters}) {
        try {

            await Services.Email.sendEmail({
                recipientEmail: this.email,
                templateName,
                parameters
            });
        }catch(e){
            console.error(e);
        throw e;
        }
    }
    User.prototype.sendSMS = async function(message) {
        try {
            if(this.primaryPhone) {
                await Services.Phone.sendSMS(this.primaryPhone, message);
            }
        }catch(e) {
            console.error(e);
            throw e;
        }
    }
    User.prototype.isCloser = function() {
        if( this.role.slug === 'closer'){
            return true;
        }
        return false;
    };
    User.prototype.isSetter = function() {
        if( this.role.slug === 'setter'){
            return true;
        }
        return false;
    };
    User.prototype.isAdmin = function() {
        if( this.role.slug === 'admin'){
            return true;
        }
        return false;
    };
    User.prototype.isContact = function() {
        if( this.role.slug === 'contact'){
            return true;
        }
        return false;
    };
    User.prototype.getGenType = async function() {
        const role = await this.getRole();
        const genTypes = await  sequelize.models.gen_type.findAll({
            raw: true,
            where: {
                'isActive': true
            }
        });
        let genType = genTypes.find(l => l.slug === 'company');
        if (role.slug === 'setter') {
            genType = genTypes.find(l => l.slug === 'setter');
        }
        if (role.slug === 'closer') {
            genType = genTypes.find(l => l.slug === 'self-gen');
        }

        if( role.slug === 'contact'){
            return false;
        }
        return genType;
    };

    User.prototype.updateFirebaseUser = async function(userObject){
        if(this.fid) {
            await admin.auth().updateUser(this.fid, userObject);
        }
    }

    User.prototype.createStripeCustomer = async function(){
        const {Stripe} = require('../../../app/services/index').Services;
        if(!this.stripeCustomerId) {
            const stripeCustomer = await Stripe.createCustomer(this.id, this.email);
            this.stripeCustomerId = stripeCustomer.id;
            await this.save();
            return true;
        }else {
            return true;
        }
    }
    User.prototype.createCustomer = async function(){
        const {Stripe} = require('../../../app/services/index').Services;
        if(!this.stripeCustomerId) {
            const stripeCustomer = await Stripe.createCustomer({
                id:this.id,
                firstName: this.firstName,
                lastName: this.lastName,
                email: this.email
            });
            this.stripeCustomerId = stripeCustomer.id;
            await this.save();
            return true;
        }else {
            return true;
        }
    }

    User.prototype.addCard = async function(token){
        const {Stripe} = require('../../../app/services/index').Services;
        if(this.stripeCustomerId) {
            const newCard = await Stripe.createCard(this.stripeCustomerId, token);
            await Stripe.updateCustomer(this.stripeCustomerId, {default_source: newCard.id});
            return newCard;
        }else {
            return false;
        }
    }
    User.prototype.getCustomer = async function(){
        const {Stripe} = require('../../../app/services/index').Services;
        if(this.stripeCustomerId) {
            const customer = await Stripe.getCustomer(this.stripeCustomerId);
            return customer;
        }else {
            return false;
        }
    }
    User.prototype.listCards = async function(){
        const {Stripe} = require('../../../app/services/index').Services;
        if(this.stripeCustomerId) {
            const cards = await Stripe.listCards(this.stripeCustomerId);
            return cards;
        }else {
            return false;
        }
    }
    User.prototype.deleteCard = async function(cardId){
        const {Stripe} = require('../../../app/services/index').Services;
        if(this.stripeCustomerId) {
            const deleted = await Stripe.deleteCard(this.stripeCustomerId, cardId);
            return deleted;
        }else {
            return false;
        }
    }
    User.prototype.createCharge = async function(amount, metadata){
        const {Stripe} = require('../../../app/services/index').Services;
        try {
            if (this.stripeCustomerId) {
                const charge = await Stripe.charge(this.stripeCustomerId, amount, metadata);
                return charge;
            } else {
                return false;
            }
        }catch(e){
            throw e;
        }
    }
    User.prototype.createCheckoutSession = async function(product, metadata){
        const {Stripe} = require('../../../app/services/index').Services;
        try {
            metadata.userId = this.id;
            const session = await Stripe.createCheckoutSession(product, metadata);
            return session;
        }catch(e){
            throw e;
        }
    }

    User.addScope('basic', {
        order:[['id','DESC']],
        where: {
            isActive: true
        },
        attributes:['id','firstName','lastName','email','primaryPhone']
    });


    return User;

};
