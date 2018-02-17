
var template = function (callback) {

    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;
    var _u = require("lodash");
    var crypto = require("crypto");
    var deepPopulate = require('mongoose-deep-populate')(mongoose);

    var modelName = "attachments";   //model name

    var model = new Schema({
        filename: {type: String},
		projectid: {type: Schema.Types.ObjectId, ref: 'projects'},
		emailid: {type: Schema.Types.ObjectId, ref: 'emails'},
		clientid: {type: String},
		causerid: {type: String},
		casessionid: {type: String},
        created_At: {type:Date},
        updated_At: {type:Date}
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

