#!/usr/bin/env node

var express = require('express');
var app = express();

// Templating engine
var swig = require('swig');
app.engine('html', swig.renderFile);

app.set('view engine', 'html');
app.set('views', __dirname + '/views');

// Set up database
var mysql = require('mysql');
var cfg = require('./cfg/db');
var db = mysql.createConnection(cfg);

// Setup basic search API to find available quarters
var api = require('./api/app');
var base = api(db);

base.get('webSocProvider').getSearchableQuarters(function(err, quarters) {
    app.set('quarters', []);
    app.configure(function() {
        app.use(express.logger());
        app.use(express.bodyParser());
        app.use(app.router);
        app.use(express.static(__dirname + "/public"));

        quarters.forEach(function(row) {
            // Create an API for each available quarter
            app.get('quarters').push(row.quarter);
            app.use('/' + row.quarter, api(db, row.quarter));
        });
    });

    app.configure('development', function () {
        app.set('port', 3000);
    });

    app.configure('production', function () {
        app.set('port', 80);
    });

    // Route includes
    var main = require('./routes/main');

    // Verbs
    app.get('/', main);
    app.get('/quarters', function (req, res) {
        res.send(app.get('quarters'));
    });

    // Port
    app.listen(app.get('port'));
});

