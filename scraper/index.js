//requires express to serve requests
var express = require('express');

//requires api to do the scraping
var api = require('./api');

//creates instance of express
var app = express();

//tells app to use api when request is issued
app.use('/', api);

//listens for requests from bot
app.listen(3000, function() {
    console.log('Node app is running on port 3000');
})