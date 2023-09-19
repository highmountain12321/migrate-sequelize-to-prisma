'use strict';

/**
 * Module dependencies.
 */

const { Services } = require('../services');


const { wrap: async } = require('co');
const jwt = require('jsonwebtoken');


const { models } = require('../../sequelize');

/**
 * Create user
 */


exports.isActive = async function(req, res,next) {

}
exports.register = async function(req, res,next) {
    try {
        if (req.body.id) {
            res.status(400).send(`Bad request: ID should not be provided, since it is determined automatically by the database.`)
            return;
        }


        const default_group = await models.user_group.findOne({where: {isDefault: true}});
        let default_role;
        if (req.body.role && req.body.role === 'partner') {
            default_role = await models.role.findOne({where: {slug: 'partner'}});
        } else {
            default_role = await models.role.findOne({where: {isDefault: true}});
        }
        if (!default_role) {
            return next({message: 'Role not found'});
        }

        const user = await models.user.create(req.body);
        user.roleId = default_role.id;
        const jwtToken = jwt.sign({user: user.id, sub: user.id, role: default_role.slug}, process.env.JWT_TOKEN, {
            expiresIn: '5h'
        });

        res.setHeader('Access-Token', jwtToken);

        let otherIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress ||  req.headers['fastly-client-ip'];;
        const userIp = otherIp.split(',')[0];
        try {
            await Services.Auth.logLocation(user.id, userIp);
        }catch(e){
            console.error(e);
        }

        await user.save();
        await default_group.addUser(user);

        res.json({token: jwtToken});
    }catch(e){
        next(e);
    }
};


exports.google = async function(req, res, next) {
    const authUrl = await Services.GAPI.authUrl();
    res.redirect(authUrl);
}
exports.googleCallback = async function(req, res, next) {
    let otherIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress ||  req.headers['fastly-client-ip'];;

    if (req.query.error) {
        return res.redirect('/');
    }
    try {
        const {finalUrl, user, token} = await Services.GAPI.authUrlCallback(req.query.code);

        try {
            const userIp = otherIp.split(',')[0];
            await Services.Auth.logLocation(user.id, userIp);
        }catch(e){
            console.error(e);
        }


        if(user.isActive === false){
            return res.send('user not active');
        }

        res.clearCookie("token");
        if(process.env.ENVIRONMENT === 'development'){
            res.cookie('token', token);
        }else {
            res.cookie('token', token, { domain: '.g3.app', path: '/', secure: true });
        }



        res.redirect(finalUrl);
    }catch(e){
        console.error(e);
        return res.redirect('/');
    }
}
exports.login = async function(req, res, next) {
    const {email, password} = req.body;
    if(!email){
        return next({message:'Email missing'});
    }
    const user = await models.user.findOne({where:{email:email, isActive:1},include:['role']});
    if(!user){
        res.json({message:'User not found'});
        return;
    }
    const hash = user.generateHash(password);
    if(!user.validPassword(password)){
        res.json({message:'Password is incorrect'});
        return;
    }
    user.set('lastLoginDate', new Date());
    await user.save();
    const token = jwt.sign({ user: user.id,sub: user.id, role: user.role.slug, partner: user.partnerId}, process.env.JWT_TOKEN, {
        expiresIn: '8h'
    });

    res.setHeader('x-userId',user.id);



    res.clearCookie("token");
    if(process.env.ENVIRONMENT === 'dev'){
        res.cookie('token', token,{ domain: 'localhost', path: '/', secure: false });
    }else {
        res.cookie('token', token, { domain: '.g3.app', path: '/', secure: true });
    }



    try {
        let otherIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress ||  req.headers['fastly-client-ip'];;
        const userIp = otherIp.split(',')[0];
        await Services.Auth.logLocation(user.id, userIp);
    }catch(e){
        console.error(e);
    }


    return res.status(201).json({token:token});
};



/**
 * Update contact
 */

exports.update = async(function* (req, res) {

});

exports.destroy = async(function* (req, res) {

});

exports.list = async(function* (req, res) {

});

exports.signin = function() {};

/**
 * Auth callback
 */




/**
 * Show sign up form
 */

exports.signup = function(req, res) {
};

/**
 * Logout
 */

exports.logout = function(req, res) {
    req.logout();
    res.redirect('/login');
};

/**
 * Session
 */




