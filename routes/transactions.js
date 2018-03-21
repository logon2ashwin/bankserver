'use strict';

module.exports = function (express, mongoose) {

    var express = require('express');
    var router = express.Router();
    var gencode = require('../lib/gencode');
    var accountService = require('../services/account');
    var account = require("../models/account").getModel(mongoose);
    var auth = require("../models/oauth").getModel(mongoose);
    var transaction = require("../models/transaction").getModel(mongoose);
    
    var transactionroute = {

        newtransaction : function(req,res){
            var newtransaction = req.body;
            var transactionobj = new transaction(newtransaction);
            transactionobj.save(function(err,results){
                if(err) res.send({error: err, status:'cannot save transaction'});
                else{
                    console.log(results);
                    var txn_id = results._id;
                    account.findOne({_id: mongoose.Types.ObjectId(newtransaction.fromaccountid)})
                    .exec(function(err,fromacc){
                        if(err) res.send({error: err, status:'cannot find fromacc'});
                        else{
                            fromacc.transactions.push(txn_id);
                            fromacc.balance -= newtransaction.transactionamount;
                            account.findOneAndUpdate({_id: fromacc._id},fromacc)
                            .exec(function(err,savefromacc){
                                if(err) res.send({error: err, status:'cannot save fromacc'});
                                else{
                                    account.findOne({_id: mongoose.Types.ObjectId(newtransaction.toaccountid)})
                                    .exec(function(err,toacc){
                                        if(err) res.send({error: err, status:'cannot find toacc'});
                                        else{
                                            toacc.transactions.push(txn_id);
                                            toacc.balance += newtransaction.transactionamount;
                                            account.findOneAndUpdate({_id: toacc._id},toacc)
                                            .exec(function(err,savetoacc){
                                                if(err) res.send({error: err, status:'cannot save toacc'});
                                                else{
                                                    res.send({status:'success'});
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            }) 
        }
    
   };
   
router.post('/', transactionroute.newtransaction);

return router;

}
