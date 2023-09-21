'use strict';

const { Services } = require('../services');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');


exports.isActive = async function(req, res, next) {
    // This function is empty, nothing to convert here
}


exports.isActive = async function(req, res,next) {

}

exports.register = async function(req, res, next) {
    try {
        if (req.body.id) {
            res.status(400).send(`Bad request: ID should not be provided, since it is determined automatically by the database.`);
            return;
        }

        const default_group = await prisma.user_group.findFirst({ where: { isDefault: true } });

        let roleConditions = { isDefault: true };
        if (req.body.role && req.body.role === 'partner') {
            roleConditions = { slug: 'partner' };
        }

        const default_role = await prisma.role.findFirst({ where: roleConditions });
        if (!default_role) {
            return next({ message: 'Role not found' });
        }

        const user = await prisma.user.create({ data: { ...req.body, roleId: default_role.id } });

        const jwtToken = jwt.sign({ user: user.id, sub: user.id, role: default_role.slug }, process.env.JWT_TOKEN, {
            expiresIn: '5h'
        });
        res.setHeader('Access-Token', jwtToken);

        const userIp = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.headers['fastly-client-ip']).split(',')[0];

        try {
            await Services.Auth.logLocation(user.id, userIp);
        } catch (e) {
            console.error(e);
        }

        if (default_group) {
            // Assuming you have a relation set up in your Prisma schema
            await prisma.user_group.update({
                where: { id: default_group.id },
                data: { users: { connect: { id: user.id } } }
            });
        }

        res.json({ token: jwtToken });
    } catch (e) {
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
    const { email, password } = req.body;
    if (!email) {
        return next({ message: 'Email missing' });
    }

    const user = await prisma.user.findFirst({
        where: { email: email, isActive: true },
        include: { role: true }
    });

    if (!user) {
        res.json({ message: 'User not found' });
        return;
    }

    // ... Assuming you have these functions in your user model in Prisma ...
    // const hash = user.generateHash(password);
    if (!user.validPassword(password)) {
        res.json({ message: 'Password is incorrect' });
        return;
    }

    await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginDate: new Date() }
    });

    const token = jwt.sign({ user: user.id, sub: user.id, role: user.role.slug, partner: user.partnerId }, process.env.JWT_TOKEN, {
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




