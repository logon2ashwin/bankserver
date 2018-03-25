'use strict';

module.exports = function (express, mongoose) {

    var express = require('express');
    var router = express.Router();
    var gencode = require('../lib/gencode');
    var accountService = require('../services/account');
    var account = require("../models/account").getModel(mongoose);
	var auth = require("../models/oauth").getModel(mongoose);
	var deepPopulate = require('mongoose-deep-populate')(mongoose);
	var mailgun = require("mailgun-js");
	var api_key = 'key-edc143ae8437160613fb7f7bc252ff99';
	var DOMAIN = 'sandbox4c143d13a6a343db850b230e1e2ad45c.mailgun.org';
	var mailgun = require('mailgun-js')({apiKey: api_key, domain: DOMAIN});
    
    var accountRoute = {
    
        getaccount: function(req, res){
			var options={};
			options._id = mongoose.Types.ObjectId(req.query.id);

			account.find(options)
			.populate(['benificiery'])
			// .populate(['transactions'])
			.deepPopulate(['transactions.toaccountid','transactions.fromaccountid'])
			.exec(function(err,content){
				if (!err) {
					res.send({status: "success",data: content});
				}else {
					res.send({status: err});
				}
			})
		},
		
        searchuser: function(req, res){
			var options={
                $or: [{username:{$regex:req.query.key,$options:'i'}},{email:{$regex:req.query.key,$options:'i'}}],
				$and:[{ username: { $ne: "admin" } } ]
            }
			account.find(options)
				.exec(function(err,content){
				if (!err) {
					res.send({status: "success",data: content});
				}else {
					res.send({status: "error"});
				}
			})
		},
		
        getuser: function(req, res){
            if(req.params.id){
                account.findOne({_id:req.params.id})
                        .exec(function(err,content){
                    if (!err) {
						res.send({status: "success",data: content});
                    }else {
						account.findOne({username:req.params.id}).exec(function(error,admininfo){
							if(error){
								res.send({status: "error"});
							}else{
								res.send({status: "success",data: admininfo});
							}
						});
                    }
                })
            }
		},
		
		confirmEmail: function(req, res){
			accountService.confirmEmail(req.body.token).then(function(result){
				return res.send({success: true});
			}, function(err){
				return res.send({success: false, error: {message: err.message, code: 20938}});
			})
		},

		resetPassword: function(req, res){
			var data = req.body;
			accountService.resetPassword(data).then(function(result){
				return res.send(200);
			}, function(err){
				return res.send({error: {message: err.message, code: 20938}});
			});
		},

		forgotPassword: function(req, res){
			if(req.body.email){
				accountService.forgotPassword({email: req.body.email}).then(function(result){
					return res.send(200);
				}, function(err){
					return res.send({error: {message: err.message, code: 20938}});
				})
			}else{
				return res.send({error: {message: "Invalid Parameter"}});
			}
		},

		changePassword: function(req, res){
			var password={};
			password = req.body
			account.findOne({'_id':req.params.id}).exec(function(err,content){
				if (!err) {
					if(password.current === content.password){
						var newPass = password.confirmpwd;
						account.update({_id: req.params.id}, {password: newPass}).exec().then(function(count){
							return res.send({success: true});
						})
					}else{
						res.send({status: "invalid_password",message: "Incorrect Old Password"});
					}
					res.send({status: "success",data: content});
				}else {
					res.send({status: "invalid_user",message: "User not found"});
				}
			})
		},

		updateprofile: function(req, res){
			//console.log("update profile information");
			if(req.query.userrole=='admin'){
				account.findOne({_id: req.params.id}, function(err, data) {
					//console.log(req.body);
					var temp = req.body;
					//console.log(req.params.id);

					account.update({_id: req.params.id}, temp).exec().then(function(count){
						//console.log(count);
						if(count.ok==1){
							res.json({status:'success'})
						}
						else{
							res.json({status:'failed'})
						}
					})
				});
			}
			else{
				res.json({"status":"access_denied"});
			}
		},
		
        login: function(req,res){
            account.findOne({ $or: [ { "username": req.body.username }, { "email": req.body.username } ],  "password": req.body.password  }).exec().then(function (user) {
                if (!user) {
                    return res.send({error: {message: "User not found"}});
                } else {
                    if (user.password != req.body.password) {
                        res.send({error: {message: "Wrong password"}});
                    }else{
						res.send({status:'success',id : user._id});
					}
					
                }
            })
        },
        createuser: function(req,res){
			var toemail = req.body.email;
			var newuser = req.body;
			var mpin = Math.floor(1000 + Math.random() * 9000);
        	account.find({email:newuser.email})
        	.exec()
        	.then(function(user){
        		if(user.length == 0){
					var createnewuser = new account(newuser);
        			createnewuser.save(function(err,result){
		        		if (err) {
		        			res.send({result:"error"});
						}else{
							var data = {
								from: 'admin@dsmt.in',
								to: toemail,
								subject: "Welcome to Dsmt",
								text: "Your secure Mpin is"+mpin+",Please don't share it with anyone"
							};
							  mailgun.messages().send(data, function (error, body) {
								res.send({result:"success", id: result._id});
							  });
						}
		        	})		
        		}
        		else{
        			res.send({"result":"exists"});
        		}
        	})	
        },
        edituser: function(req,res){
        	account.find({_id:req.params.id})
        	.exec(function(err,result){
        		if (err) {
        			//console.log(err);
        			res.send(err);
        		}else{
        			res.send(result);
        		}
        	})
        },
        updateuser: function(req,res){
        	account.findOneAndUpdate({_id:req.body._id},req.body)
        	.exec(function(err,result){
        		if (err) {
        			//console.log(err);
        			res.send(err);
        		}else{
        			res.send(result);
        		}
        	})
        },
        deleteuser: function(req,res){
        	//console.log(req.query.id);
        	account.deleteOne({_id:req.query.id})
        	.exec(function(err,result){
        		if (err) {
        			//console.log(err);
        			res.send(err);
        		}else{
        			res.send({results:'success'});
        		}
        	})
		}       
   };
   
router.post('/', accountRoute.createuser);
router.post('/login',accountRoute.login);
router.post('/confirmEmail', accountRoute.confirmEmail);
router.post('/resetPassword', accountRoute.resetPassword);
router.post('/forgotPassword', accountRoute.forgotPassword);
router.post("/changepwd/:id", accountRoute.changePassword);
router.get('/search', accountRoute.searchuser);
router.get('/accountdetails', accountRoute.getaccount);
router.post('/update/:id', accountRoute.updateprofile);
router.delete('/deleteuser', accountRoute.deleteuser);
router.get('/edituser/:id', accountRoute.edituser);
router.put('/updateuser', accountRoute.updateuser);

return router;

}
