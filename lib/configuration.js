var configuration = function () {
	var config;

	//var devconfig = require("../config/config-dev.js");
	//var testconfig = require("../config/config-test.js");
	var prodconfig = require("../config/configprod.js");


	if (process.env.ENVIRONMENT=='prod') {
		//var configfile = "../config/configprod.js";
		//"../config/config-"+process.env.ENVIRONMENT +".js";
		//console.log(configfile)
		config = require("../config/configprod.js");


		//config = require("../config/configdev.js");
	
		//console.log("Current ENVIRONMENT is "+process.env.ENVIRONMENT);
	} else {
		config = require("../config/configdev.js");
		console.log("Set ENVIRONMENT=dev|test|prod");
	}
	return config;
};

module.exports = {
	getconfig: configuration
};

/*
 var config = require("../common/configuration").getconfig();
* */
