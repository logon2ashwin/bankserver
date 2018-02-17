var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var fs = require("fs");
var http = require('http');

var config = require("./lib/configuration").getconfig();			
var Mongoose = require('./lib/mongooseConnect').initialize();



var app = express();
var server = http.createServer(app);



var timeout = require('connect-timeout'); //express v4
app.use(timeout(120000));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(require('./lib/cors'));

app.use(require('./lib/auth'));





app.use(function(req, res, next){
    res.setTimeout(480000, function(){ // 4 minute timeout adjust for larger uploads
        console.log('Request has timed out.');
            res.send(408);
        });

    next();
});


app.use("/api/"+config.service.apiversion + "/account", require("./routes/account.js")(express, Mongoose));
app.use("/api/"+config.service.apiversion + "/email", require("./routes/email.js")(express, Mongoose));

app.get('/', function (req, res) {
  res.send('Hello World!')
});


app.set('port', config.service.port || 8080);

server.listen(app.get('port'),'0.0.0.0', function () {
  console.log('Server listening at port %d',app.get('port'));
});


