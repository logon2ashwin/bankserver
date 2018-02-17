'use strict';

module.exports = function (express, mongoose) {

    var express = require('express');
    var router = express.Router();
    var gencode = require('../lib/gencode');
    var accountService = require('../services/account');
    var account = require("../models/account").getModel(mongoose);
    var auth = require("../models/oauth").getModel(mongoose);
    
    var accountRoute = {
    
        create: function(req, res){
            //console.log("Create user");
            accountService.register(req.body).then(function(user){
                //console.log(user);
                return res.status(200).send({code:1,status: "success"});
            }, function(err){
                //console.log(err);
                return res.status(200).send({code:0,status: err.message});
            })
        },
        getalluser: function(req, res){
            //console.log("Get all user Detail");
			var options={};
			/*if(req.params.type=='block'){
				options={
					status:'block',
					username: { $ne: "admin" }
				};
			}else if(req.params.type=='inactive'){
				options={
					status:'inactive',
					username: { $ne: "admin" }
				};
			}else if(req.params.type=='active'){
				options={
					status:'active',
					username: { $ne: "admin" }
				};
			}else{
				options={ username: { $ne: "admin" }};
			}*/


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
            //console.log("Search User");      
			//console.log(req.query.key);
			var options={
                $or: [{username:{$regex:req.query.key,$options:'i'}},{email:{$regex:req.query.key,$options:'i'}}],
				$and:[{ username: { $ne: "admin" } } ]
            }
			//console.log(options)
			account.find(options)
					.exec(function(err,content){
						//console.log(content);
				if (!err) {
					res.send({status: "success",data: content});
				}else {
					res.send({status: "error"});
				}
			})
		},
		
        getuser: function(req, res){
            //console.log("Get user Detail");
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
							
                        //res.send({status: "error"});
                    }
                })
            }
		},
		
        getreferal: function(req, res){
            //console.log("Get referral user");
            if(req.params.id){
                account.find({'sponsor':req.params.id})
                        .exec(function(err,content){
                    if (!err) {
                        res.send({status: "success",data: content});
                    }else {
                        res.send({status: "error"});
                    }
                })
            }
		},
		
		confirmEmail: function(req, res){
			//console.log("data with query"+req.body.token);
			accountService.confirmEmail(req.body.token).then(function(result){
				return res.send({success: true});
			}, function(err){
				return res.send({success: false, error: {message: err.message, code: 20938}});
			})
		},

		resetPassword: function(req, res){
			//console.log("Reset Password")
			var data = req.body;
			accountService.resetPassword(data).then(function(result){
				return res.send(200);
			}, function(err){
				return res.send({error: {message: err.message, code: 20938}});
			});
		},

		forgotPassword: function(req, res){
			//console.log("Forgot Password")
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
			//console.log("password change");
			var password={};
			password = req.body
			//console.log(password);
			//check current password
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

sociallogin: function(req,res) {
    //console.log("social login");
    var query = { 
    				"socialtype": req.body.socialtype, 
    				"socialid": req.body.socialid 
    			}

    //console.log("Find Query");			
    //console.log(query);
    if(typeof req.body.socialtype!="undefined" && typeof req.body.socialid!="undefined"){
	    account.findOne(query).exec().then(function (user) {
	        if (user) {

	            var newtoken = gencode.generateToken();
	            //console.log("user exist update token")
	            var temp = {
	                token: newtoken,
	                session: new Date()
	            }
	            auth.update({ user_id: user._id }, temp, { upsert: true }).exec().then(function (count) {
	                //console.log(count);
	                if (count.ok == 1) {
	                    return res.status(200).send({ status: 'authenticated', token: temp.token, userid: user });
	                }
	                else {
	                    res.json({ status: 'invalid_user' })
	                }
	            })

	        } else {

	            var newuser = {
	                social_name: req.body.social_name,
	                socialtype: req.body.socialtype,
	                socialid: req.body.socialid,
	                social_token: req.body.social_token
	            }
	            //console.log("new social login ", newuser);

	            var createnewuser = new account(newuser);
	            createnewuser.save(function (err, user) {
	                if (err) {
	                    //console.log(err);
	                    res.send(err);
	                } else {

	                    var newtoken = gencode.generateToken();
	                    //console.log("new token")
	                    var temp = {
	                        user_id: user._id,
	                        token: newtoken,
	                        session: new Date()
	                    }
	                    var authtype = new auth(temp);
	                    authtype.save(function (err, value) {     // data saved in product collection
	                        if (!err) {
	                            //console.log(value)
	                            return res.status(200).send({ status: 'authenticated', token: temp.token, userid: user });
	                        } else {
	                            res.json({ status: 'invalid_user' })
	                        }
	                    });
	                }
	            });
	        }
	    })
    }
    else{
    	res.json({ status: 'invalid_user' })
    }

		},
		
        login: function(req,res){
            //console.log("login user");
            //console.log(req.body)
            account.findOne({ $or: [ { "username": req.body.username }, { "email": req.body.email } ],  "password": req.body.password  }).exec().then(function (user) {
                //console.log("userdata ",user)
                if (!user) {
                    return res.status(401).send({error: {message: "User not found"}});
                } else {
                    //var hashPassword = account.encryptPassword(req.body.password)
                    if (user.password != req.body.password) {
                        res.status(401).send({error: {message: "Wrong password"}})
                    } else {
						 //check if user has validated email
						if (user.emailToken) {
							//console.log("account not activated")
							res.status(401).send({
								error: {
									message: "You must activate your email",
									code: 40987,
									email: user.email
								}
							});
						} else if (user.status == "block") {
							//console.log("Account blocked")
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
        showusers: function(req,res){
        	account.find()
        	.exec(function(err,result){
        		if (err) {
        			//console.log(err);
        			res.send(err);
        		}else{
        			res.send(result);
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
        },
        remove:function(req,res){
        	//console.log("remove called");
        	if(req.query.userrole=='admin'){
        		var query = { _id:req.params.id}
	            account.find(query).remove().exec(function(err, data) {
	                if(!err){
	                    res.send({status:'success'});
	                }
	                else{
	                    res.send({'status':'error'});
	                }
	            })
        	}
        	else{
        		res.json({"status":"access_denied"});
        	}

            
        }
        
   };
   
router.post('/', accountRoute.create);
router.post('/login',accountRoute.login);
router.post('/confirmEmail', accountRoute.confirmEmail);
router.post('/resetPassword', accountRoute.resetPassword);
router.post('/forgotPassword', accountRoute.forgotPassword);
router.post("/changepwd/:id", accountRoute.changePassword);
router.get('/referral/:id', accountRoute.getreferal);
router.get('/search', accountRoute.searchuser);
router.get('/list', accountRoute.getalluser);
// router.get('/:id', accountRoute.getuser);
router.get('/', accountRoute.showusers);
router.post('/update/:id', accountRoute.updateprofile);
router.delete('/update/:id', accountRoute.remove);
router.post('/createuser', accountRoute.createuser);
router.post('/sociallogin', accountRoute.sociallogin);
router.delete('/deleteuser', accountRoute.deleteuser);
router.get('/edituser/:id', accountRoute.edituser);
router.put('/updateuser', accountRoute.updateuser);

return router;

}
