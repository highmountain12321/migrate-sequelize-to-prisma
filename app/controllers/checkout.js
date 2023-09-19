'use strict';

/**
 * Module dependencies.
 */

const { wrap: async } = require('co');
const _ = require('lodash');


exports.create = async function (req, res, next) {
    try{
        let userModel = req.userModel;
        const session = await userModel.createCheckoutSession()
        res.json({response:session});
    }catch(e){
        next(e);
        return;
    }
}
