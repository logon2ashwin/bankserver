'use strict';

module.exports = function (express, mongoose) {

    var express = require('express');
    var router = express.Router();
    var gencode = require('../lib/gencode');
    var accountService = require('../services/account');
    var account = require("../models/account").getModel(mongoose);
    var auth = require("../models/oauth").getModel(mongoose);
    
    var accountRoute = {
    
        getalluser: function(req, res){
			var options={};
			account.find(options)
					.exec(function(err,content){
				if (!err) {
					res.send({status: "success",data: content});
				}else {
					res.send({status: "error"});
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
            account.findOne({ $or: [ { "username": req.body.username }, { "email": req.body.email } ],  "password": req.body.password  }).exec().then(function (user) {
                if (!user) {
                    return res.status(401).send({error: {message: "User not found"}});
                } else {
                    if (user.password != req.body.password) {
                        res.status(401).send({error: {message: "Wrong password"}})
                    } else {
						if (user.emailToken) {
							res.status(401).send({
								error: {
									message: "You must activate your email",
									code: 40987,
									email: user.email
								}
							});
						} else if (user.status == "block") {
							res.status(401).send({
								error: {
									message: "Your account has been blocked. Contact our support team for more details.",
									code: 40987,
									email: user.email
								}
							});
						} else {
							var newtoken;
							//console.log("login success")
							auth.findOne({user_id:user._id}).exec().then(function(data){
								if(data){
								   newtoken=  gencode.generateToken();
									//console.log("update token")
									var temp={
										token:newtoken,
										session:new Date()
									}
									auth.update({user_id: user._id}, temp).exec().then(function(count){
										//console.log(count);
										if(count.ok==1){
											return res.status(200).send({status:'authenticated',token:temp.token,userid:user});
										}
										else{
											res.json({status:'invalid_user'})
										}
									})
								}else{
								   newtoken=  gencode.generateToken();
									//console.log("new token")
									var temp={
										user_id:user._id,
										token:newtoken,
										session:new Date()
									}
									var authtype = new auth(temp);
									authtype.save(function (err, value){     // data saved in product collection
										if (!err){
											//console.log(value)
											return res.status(200).send({status:'authenticated',token:temp.token,userid:user});
										}else{
											res.json({status:'invalid_user'})
										}
									});
								}
							})
						}
					}
                }
            })
        },
        createuser: function(req,res){
        	var newuser = req.body;
        	account.find({email:newuser.email}).exec().then(function(user){
        		if(user.length == 0){
        			var createnewuser = new account(newuser);
        			createnewuser.save(function(err,result){
		        		if (err) {
		        			res.send({result:"error"});
		        		}else{
		        			res.send({result:"success"});
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
router.get('/list', accountRoute.getalluser);
// router.get('/:id', accountRoute.getuser);
router.post('/update/:id', accountRoute.updateprofile);
// router.post('/createuser', accountRoute.createuser);
router.delete('/deleteuser', accountRoute.deleteuser);
router.get('/edituser/:id', accountRoute.edituser);
router.put('/updateuser', accountRoute.updateuser);

return router;

}
