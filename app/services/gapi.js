const { wrap: async } = require('co');
const jwt = require('jsonwebtoken');
const moment = require('moment');

const google = require('googleapis').google;
const OAuth2 = google.auth.OAuth2;
const clientId = process.env.GOOGLE_CLIENTID;
const clientSecret = process.env.GOOGLE_SECRET;
const getCalId = (id)=>{
    id = id.toString();
    while(id.length < 5){
        id = id+'01'
    }
    return id;
}

exports.deleteCalendarEvent = async function(userId,calendarId = 'primary', appointmentId) {
    return new Promise(async (resolve, reject) => {
        const {models} = require("../../sequelize");

        const integrationModel = await models.integration.findOne({
            where: {userId: userId, name: 'google', isActive: true}
        });
        if (!integrationModel) {
            return reject('Missing integration')
        }

        const appointmentModel = await models.appointment.findOne({
            where: {id: appointmentId},
            include: {
                model: await models.contact,
                as: 'contact'
            }
        });
        if (!appointmentModel) {
            return reject('Missing appointment')
        }


        const oauth2Client = new OAuth2(clientId, clientSecret);

        oauth2Client.setCredentials({access_token: integrationModel.accessToken, refresh_token: integrationModel.refreshToken});

        let id = getCalId(appointmentModel.id);

        let calendar = google.calendar({version: 'v3', auth:oauth2Client});
        await calendar.events.delete({
            auth: oauth2Client,
            calendarId: calendarId,
            eventId:id
        }, (err, res) => {
            if (err) {
                console.error('ERROR ',err);
                reject(err)
            } else {
                resolve(res.data);
            }
        });

    });
}
exports.createCalendarEvent = async function(userId,calendarId = 'primary', appointmentId, attendees =[]) {
    return new Promise(async (resolve, reject) => {
        const {models} = require("../../sequelize");

        const integrationModel = await models.integration.findOne({
            where: {userId: userId, name: 'google', isActive:true}
        });
        if(!integrationModel){
            return reject('Missing integration')
        }

        const appointmentModel = await models.appointment.findOne({
            where: {id: appointmentId},
            include: {
                model: await models.contact,
                as: 'contact'
            }
        });
        if(!appointmentModel){
            return reject('Missing appointment')
        }

        let timezone;

        if(appointmentModel.timezone){
            timezone = appointmentModel.timezone.nameValue;
        }

        let startDateTime;
        let endDateTime;


        if(appointmentModel.startDate) {
            startDateTime =  moment(appointmentModel.startDate).utcOffset(appointmentModel.timezoneOffset, true).toISOString()
            endDateTime = moment(appointmentModel.endDate).utcOffset(appointmentModel.timezoneOffset, true).toISOString()
        }
        const oauth2Client = new OAuth2(clientId, clientSecret);

        oauth2Client.setCredentials({access_token: integrationModel.accessToken, refresh_token: integrationModel.refreshToken});


        let title = `${appointmentModel.contact.firstName} ${appointmentModel.contact.lastName}`
        if(appointmentModel.contact.isCommercial){
            title = appointmentModel.contact.busName;
        }
        const description = `
        Address: 
        ${appointmentModel.contact.address1}, ${appointmentModel.contact.city}, ${appointmentModel.contact.state}, ${appointmentModel.contact.postalCode}
        Phone:
        ${appointmentModel.contact.primaryPhone}
        Email:
        ${appointmentModel.contact.email}
        `;
        let id = getCalId(appointmentModel.id);

        let calendar = google.calendar({version: 'v3', auth:oauth2Client});

        try{
        const event = await calendar.events.get({
            auth: oauth2Client,
            calendarId: calendarId,
            eventId:id
        });
        if(event && event.data){

            const update = await calendar.events.update({
                auth: oauth2Client,
                calendarId: calendarId,
                eventId: id,
                resource: {
                    'summary': title,
                    'description': description,
                    'start': {
                        'dateTime': startDateTime
                    },
                    'end': {
                        'dateTime': endDateTime
                    },
                    'colorId' : 4 ,
                    'sendUpdates':'all',
                    'status' : 'confirmed',
                    attendees: attendees
                }
            });
            return resolve(update.data);

        }
        }catch(e){

        }


        await calendar.events.insert({
            auth: oauth2Client,
            calendarId: calendarId,
            resource: {
                 id:id,
                'summary': title,
                'description': description,
                'start': {
                    'dateTime': startDateTime,
                    'timeZone':timezone
                },
                'end': {
                    'dateTime': endDateTime,
                    'timeZone':timezone
                },
                'attendees': attendees,
                'reminders': {
                    'useDefault': false,
                    'overrides': [
                        {'method': 'email', 'minutes': 24 * 60},
                        {'method': 'popup', 'minutes': 10},
                    ],
                },
                'colorId' : 4 ,
                'sendUpdates':'all',
                'status' : 'confirmed'
            },
        }, (err, res) => {
            if (err) {
                reject(err)
            } else {
                resolve(res.data);
            }
        });
    })
}
exports.authUrl = async function() {
    const redirect = `${process.env.API_URL}/auth/google/callback`

// Create an OAuth2 client object from the credentials in our config file
    const oauth2Client = new OAuth2(clientId, clientSecret, redirect);
// Obtain the google login link to which we'll send our users to give us access
    const loginLink = oauth2Client.generateAuthUrl({
        scope: [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
            'openid'] // Using the access scopes from our config file
    });
    return loginLink;
}

exports.authUrlCallback = async function(code) {
    return new Promise((resolve,reject)=> {
        const {models} = require("../../sequelize");

        const redirect = `${process.env.API_URL}/auth/google/callback`;

// Create an OAuth2 client object from the credentials in our config file
        const oauth2Client = new OAuth2(clientId, clientSecret, redirect);

        oauth2Client.getToken(code, function (err, token) {
            if(err) {
                return reject(err);
            }


            var oauth2Client = new OAuth2();
            oauth2Client.setCredentials({access_token: token.access_token});
            var oauth2 = google.oauth2({
                auth: oauth2Client,
                version: 'v2'
            });
            oauth2.userinfo.get(
                async function (err, results) {
                    if (err) {
                        return reject(err);
                    }


                        const profile = results.data;

                        const user = await models.user.findOne({
                            where: {email: profile.email},
                            include: {
                                model: await models.role,
                                as: 'role'
                            }
                        });
                        if (user) {
                            user.picUrl = profile.picture;
                            user.firstName = profile.given_name;
                            user.lastName = profile.family_name;
                            user.set('lastLoginDate', new Date());
                            let role = user.role;
                            if (!role) {
                                const default_role = await models.role.findOne({where: {isDefault: true}});
                                user.roleId = default_role.id;
                                await user.save();
                                role = default_role;
                            }

                            await user.save();
                            const jwtToken = jwt.sign({
                                user: user.id,
                                sub: user.id,
                                role: role.slug
                            }, process.env.JWT_TOKEN, {
                                expiresIn: '5h'
                            });
                            const finalUrl = `${process.env.FRONTEND_URL}/#token=${jwtToken}`;





                            return resolve({finalUrl,user, token:jwtToken});


                        } else {
                            const default_group = await models.user_group.findOne({where: {isDefault: true}});
                            const default_role = await models.role.findOne({where: {isDefault: true}});
                            const user = await models.user.create({
                                picUrl: profile.picture,
                                firstName: profile.given_name,
                                lastName: profile.family_name,
                                email: profile.email,
                                password: '0000000000'
                            });
                            user.userGroupId = default_group.id;
                            user.roleId = default_role.id;

                            await user.save();
                            const jwtToken = jwt.sign({
                                user: user.id,
                                sub: user.id,
                                role: default_role.slug
                            }, process.env.JWT_TOKEN, {
                                expiresIn: '5h'
                            });
                            const finalUrl = `${process.env.FRONTEND_URL}/#token=${jwtToken}`;
                            return resolve({finalUrl,user, token: jwtToken});


                    }
                });


        });
    });
}




exports.servicesUrl = async function(userId) {
    const redirect = `${process.env.API_URL}/integration/google/callback`

// Create an OAuth2 client object from the credentials in our config file
    const oauth2Client = new OAuth2(clientId, clientSecret, redirect);
// Obtain the google login link to which we'll send our users to give us access
    const loginLink = oauth2Client.generateAuthUrl({
        state: userId,
        access_type: 'offline', // Indicates that we need to be able to access data continously without the user constantly giving us consent
        scope: [
            'https://www.googleapis.com/auth/calendar'] // Using the access scopes from our config file
    });
    return loginLink;
}

exports.servicesUrlCallback = async function(userId,code) {
    return new Promise((resolve,reject)=> {
        const {models} = require("../../sequelize");

        const finalUrl = `${process.env.FRONTEND_URL}/sale/profile`;

        const redirect = `${process.env.API_URL}/integration/google/callback`;

// Create an OAuth2 client object from the credentials in our config file
        const oauth2Client = new OAuth2(clientId, clientSecret, redirect);

        oauth2Client.getToken(code, async function (err, token) {
            if(err) {
                console.error('ERROR ',err);
                return reject(err.response.data);
            }

            const integration = await models.integration.findOne({
                where: {userId: userId, name:'google', isActive:true}
            });
            if(!integration && !token.refresh_token){
                return resolve(finalUrl+'?msg=Reauthorize app by revoking access and logging back in. https://myaccount.google.com/u/0/permissions')
            }
            if(!integration && token.refresh_token){
                const newIntegration = await models.integration.create({
                    isActive:true,
                    name:'google',
                    userId:userId,
                    accessToken: token.access_token,
                    refreshToken: token.refresh_token
                });
                await newIntegration.save();
                return resolve(finalUrl+'?msg=Google Calendar authorized');
            }
            if(integration && token.refresh_token){
                integration.refreshToken = token.refresh_token;
                integration.accessToken = token.access_token;
                await integration.save();
                return resolve(finalUrl);
            }
            return resolve(finalUrl+'?msg=Reauthorize app by revoking access and logging back in. https://myaccount.google.com/u/0/permissions')


        });
    });
}
