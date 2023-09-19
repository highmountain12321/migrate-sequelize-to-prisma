'use strict';

/**
 * Module dependencies.
 */

const { wrap: async } = require('co');
const _ = require('lodash');


exports.create = async function (req, res, next) {
    try{
        const {token} = req.body;
      let userModel = req.userModel;
      if(!userModel.stripeCustomerId){
          await userModel.createCustomer();
          await userModel.reload();
      }
      const newCard = await userModel.addCard({token});
      res.json({success:true});
    }catch(e){
        next(e);
        return;
    }
}
exports.list = async function (req, res, next) {
    try{
        let userModel = req.userModel;
        if(!userModel.stripeCustomerId){
            await userModel.createCustomer();
            await userModel.reload();
        }
        const cards = await userModel.listCards();
        if(!cards){
            res.json({rows:[]});
            return;
        }
        res.json({rows:cards.data});
    }catch(e){
        next(e);
        return;
    }
}
exports.delete = async function (req, res, next) {
    try{
        let userModel = req.userModel;
        const cardId = req.body.cardId;
        if(!userModel.stripeCustomerId){
            await userModel.createCustomer();
            await userModel.reload();
        }
        const cards = await userModel.deleteCard(cardId);
        if(!cards){
            res.json({success:false});
            return;
        }
        res.json({success:true});
    }catch(e){
        next(e);
        return;
    }
}
