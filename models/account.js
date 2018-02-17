var template = function (callback) {

    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;
    var _u = require("lodash");
    var crypto = require("crypto");
    var deepPopulate = require('mongoose-deep-populate')(mongoose);

    var modelName = "accounts";   //model name

    var model = new Schema({
        name: {type: String},
        country: {type: String},
        phone: {type: String},
        profilepicture: {type: String},
        email: {type: String},
        username: {type: String},
        password: {type: String},
	social_name: {type: String},
	socialtype: {type: String},
	socialid: {type: String},
	social_token: {type: String},
	role: {type: String, enum: ["admin","leader","scorer","user"], default: "user"},	
        cd: {type: Date, default: Date.now}   
    });

    model.pre('save', function(next) {
        var currentDate = new Date();

        this.updated_At = currentDate;
        if (!this.created_At)
            this.created_At = currentDate;

        next();
    });

    model.plugin(deepPopulate, {});

    try {
        if (mongoose.model(modelName))
            return mongoose.model(modelName);
    } catch (e) {
        if (e.name === 'MissingSchemaError') {
            console.log("Registered Model: "+ modelName);
            return mongoose.model(modelName, model);
        }
    }
};

module.exports = {
    getModel: template,
    registerModel: template
};

