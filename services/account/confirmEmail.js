module.exports = function(token){
	var account = require("../../models/account").getModel();

	return account.findOne({emailToken: token}).exec().then(function(user){
        console.log(user);
		if(user){

			return account.update({emailToken: token}, {$set: {emailToken: null, status: "active"}}).exec()
		}else{
			throw (new Error("TokenNotFound"));
			return;
		}
	})
}
