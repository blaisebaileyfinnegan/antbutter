#!/usr/bin/env node

var express = require('express');
var app = express();
var mysql = require('mysql');

// Templating engine
var swig = require('swig');
app.engine('html', swig.renderFile);

app.set('view engine', 'html');
app.set('views', __dirname + '/views');


// Middleware
app.configure(function() {
    app.use(express.logger());
    app.use(express.bodyParser());
    app.use(app.router);
    app.use(express.static(__dirname + "/public"));
});

// Route includes
var main = require('./routes/main');

// Verbs
app.get('/', main);

// Port
app.listen(3000);
