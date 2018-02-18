var template = function (callback) {

    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;
    var _u = require("lodash");
    var crypto = require("crypto");
    var deepPopulate = require('mongoose-deep-populate')(mongoose);

    var modelName = "transactions";   //model name

    var model = new Schema({
       transactionamount : { type: Number },
       transactiontime : { type: Date, default: Date.now },
       fromaccount : { type: Number},
       toaccount : { type: Number},
       fromaccountid : { type: Schema.Types.ObjectId, ref: 'accountdetails'},
       toaccountid : { type: Schema.Types.ObjectId, ref: 'transactions'}
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

