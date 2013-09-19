#!/usr/bin/env node

var express = require('express');
var app = express();

// Templating engine
var swig = require('swig');
app.engine('html', swig.renderFile);

app.set('view engine', 'html');
app.set('views', __dirname + '/views');

// Inject database connection
var mysql = require('mysql');
var cfg = require('./cfg/db');
var db = mysql.createConnection(cfg);

// Search API
var api = require('./api/app')(db, 'F13');
 
app.configure(function() {
    app.use(express.logger());
    app.use(express.bodyParser());
    app.use(app.router);
    app.use(express.static(__dirname + "/public"));
    app.use(api);
});

// Route includes
var main = require('./routes/main');

// Verbs
app.get('/', main);

// Port
app.listen(3000);
