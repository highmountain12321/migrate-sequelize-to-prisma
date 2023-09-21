const { wrap: async } = require('co');
const { Services } = require('../services');
const jwt = require('jsonwebtoken');

const _ = require('lodash');

exports.googleServices = async function (req, res, next) {
    try {
        const token = req.query.accessToken;
        const dtoken = jwt.decode(token, {complete: true});
        const user = dtoken.payload.user;
        const authUrl = await Services.GAPI.servicesUrl(user);

        res.redirect(authUrl);
    }catch(e){
        res.json(e);
    }
}
exports.googleServicesCallback = async function (req,res) {
    if (req.query.error) {
        res.json(req.query.error);
        return;
    }
    const userId = req.query.state;
    try {

        const callback = await Services.GAPI.servicesUrlCallback(userId, req.query.code);
        console.log(callback);

        res.redirect(callback);
    }catch(e){
        return res.json(e);
    }
}
exports.googleCreateCalendarEvent = async function (req,res) {
    const userId =6;
    const appointmentId = 1;
    const calendar = 'primary';


    try {
        const callback = await Services.GAPI.createCalendarEvent(userId, calendar,appointmentId,[]);
        console.log(callback);

        res.json(callback);
    }catch(e){
        console.error('eror',e);
        res.json(e);
       // return res.redirect('/');
    }
}
