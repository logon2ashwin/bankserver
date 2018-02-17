var template = function (callback) {
	
	var mongoose = require('mongoose');
	var mongoosePaginate = require('mongoose-paginate');
	var Schema = mongoose.Schema;

	var modelName = "emails";   //model name
	var model = new Schema({ 
		projectid: {type: String},
		projectleadid : {type: Schema.Types.ObjectId,ref: 'projectleads'},
		campaignid: {type: String},
		clientid: {type: String},
		receipientemail: {type: String},
		subject: {type: String},
		message: {type: String},
		updated_At: {type: Date},
		created_At: {type: Date},
		casessionid: {type: String},
		causerid: {type: String},
		attachments:[{type: Schema.Types.ObjectId, ref: 'attachments', required: true}],
		attachmentlinks: [{type: String}]
	});
	
	model.plugin(mongoosePaginate);
	
    model.pre('save', function(next) {
        var currentDate = new Date();

        this.updated_At = currentDate;
        if (!this.created_At)
            this.created_At = currentDate;

        next();
    });

    try {
        if (mongoose.model(modelName))
            return mongoose.model(modelName);
    } catch (e) {
        if (e.name === 'MissingSchemaError') {
            return mongoose.model(modelName, model);
        }
    }
}

module.exports = {
    getModel: template,
    registerModel: template
};