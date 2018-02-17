'use strict';

module.exports = function (express, mongoose) {

    var router = express.Router();

    var project = {
		new: function(req, res){
			console.log("new email request recevied");
			var Email = require("../models/emails").getModel();
			var projectid = req.params.projectid;
			var emailinfo = {
				projectid: projectid,
				clientid: req.body.clientid
			}
			if(req.query.receipientemail){
				emailinfo.receipientemail = req.query.receipientemail;
			}
			if(req.query.projectleadid){
				emailinfo.projectleadid = req.query.projectleadid;
			}
			
			var email = new Email(emailinfo);
			email.save(function(err, emailrecord){
		      if (err) {
		        console.log(err);
		  	    res.send('{"status": "error"}');
		      } else {
		        console.log('success', emailrecord);
				res.status(200).send({
					message: 'success',
					emailid: emailrecord._id
				});
			  }
			});
		},
		getsavedemail:function(req,res){
			var Email = require("../models/emails").getModel();
			Email.findOne({_id:req.params.emailid}).exec(function (err, results) {
				if (err) {
		  	    res.send('{"status": "error"}');
			    } 
			    else {
		      		res.status(200).send({
						status: 'success',
						email: results
					});
			    }
			})
		},
        send: function (req, res) {
            console.log("send email request recevied");
		    console.log(req.body);
			
			var emailid, projectid, campaignid, receipientemail, subject, message, casessionid, causerid, attachmentlinks = [], clientid, projectleadid;
			
		    var config = require("../lib/configuration").getconfig();
		    
			var Attachment = require("../models/attachments").getModel();
			var Email = require("../models/emails").getModel();
			var Email_manager = require("../lib/email_manager");
  
			projectid = req.params.projectid;


			emailid = req.params.emailid;

			if(typeof req.body.clientid != "undefined"){
				clientid = req.body.clientid;
			}else{
				clientid = "";
			}
			
			if(typeof req.body.projectleadid != "undefined"){
				projectleadid = req.body.projectleadid;
			}else{
				projectleadid = "";
			}
									
			if(typeof req.body.campaignid != "undefined"){
				campaignid = req.body.campaignid;
			}else{
				campaignid = "";
			}
			
			if(typeof req.body.receipientemail != "undefined"){
				receipientemail = req.body.receipientemail;
			}else{
				receipientemail = "";
			}
			
			if(typeof req.body.subject != "undefined"){
				subject = req.body.subject;
			}else{
				subject = "";
			}
			
			if(typeof req.body.message != "undefined"){
				message = req.body.message;
			}else{
				message = "";
			}
			
			if(typeof req.body.casessionid != "undefined"){
				casessionid = req.body.casessionid;
			}else{
				casessionid = "";
			}
			
			if(typeof req.body.attachmentlinks != "undefined"){
				attachmentlinks = req.body.attachmentlinks;
			}else{
				attachmentlinks = [];
			}
			
			if(typeof req.body.causerid != "undefined"){
				causerid = req.body.causerid;
			}else{
				causerid = "";
			}
			
			 console.log("attachments1", attachmentlinks)
			if(projectid && receipientemail && subject && message){
  			    console.log("attachments2", attachmentlinks)
				
			    Projects.findOne({_id:projectid},function (err, projectdetails) {
					console.log("attachments3", attachmentlinks, projectid, req.params)
			      
  			      if (err) {
  			        console.log(err);
  			  	    res.send('{"status": "error"}');
  			      } else {
  			        console.log('success', projectdetails);
  				    projectdetails.smtp.template = "blank";
					
  					console.log("attachmentlinks", attachmentlinks);
					
					var emailinfo = {
						projectid: projectid,
						projectleadid: projectleadid,
						clientid: clientid,
						campaignid: campaignid,
						receipientemail: receipientemail,
						subject: subject,
						message: message,
						casessionid: casessionid,
						causerid: causerid,
						attachmentlinks: attachmentlinks
					};
					
					projectdetails.projectleadid = projectleadid;
					
					var CryptoJS = require("crypto-js");
					
					var trackid = {
						emailid : emailid,
						projectleadid : projectleadid,
						receipientemail: receipientemail
					};
					
					console.log("trackid :",trackid);	
					var encrypted_trackid = CryptoJS.AES.encrypt(JSON.stringify(trackid), 'fusioncorpisclofus').toString();
					var trackerimage = config.service.baseurl+"/api/"+config.service.apiversion+"/attachment/default.png?param="+encodeURIComponent(encrypted_trackid);
					console.log("encrypted_trackid", encrypted_trackid)
					console.log("trackerimage", trackerimage)
					console.log("attachmentlinks--", attachmentlinks)
					
					Email.findOneAndUpdate({_id: emailid}, emailinfo,function(error, result) {
					    if (error){ 
							console.log("error", error)
						}else{
							console.log("success")
						}
					});
					
					
					for(var i=0;i<attachmentlinks.length;i++){
						
						var linktrackid = decodeURIComponent(attachmentlinks[i].split("/")[6]).toString();
						var filename = attachmentlinks[i].split("/")[7];
						
						var bytes  = CryptoJS.AES.decrypt(linktrackid, 'fusioncorpisclofus');
						var updatetrackid = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
						updatetrackid.receipientemail = receipientemail;
						updatetrackid.emailid = emailid;
						updatetrackid.projectleadid = projectleadid;
						
						var encrypted_updatetrackid = CryptoJS.AES.encrypt(JSON.stringify(updatetrackid), 'fusioncorpisclofus').toString();
						attachmentlinks[i] = config.service.baseurl+"/api/"+config.service.apiversion+"/attachment/"+filename+"?param="+encodeURIComponent(encrypted_updatetrackid);
					}
					
					
					console.log("attachmentlinks3--", attachmentlinks, projectdetails)
					Email_manager.sendEmail(projectdetails, receipientemail, subject, message, "", "", attachmentlinks, trackerimage, function(status, detail){
				    	console.log(status, detail);
						return res.status(200).send({
							message: 'success'
						});
	  				});
					
  			      }
			    });
				
			}else{
				res.send('{"status": "invalid_request"}');
			}
        }
    };
	router.post('/new/:projectid', project.new);
    router.post('/:projectid/:emailid', project.send);
    router.get('/:emailid', project.getsavedemail);
	
	

    return router;
};
