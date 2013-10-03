#!/usr/bin/env node

var express = require('express');
var app = express();

// Set up database
var mysql = require('mysql');
var cfg = require('./cfg/db');
var pool = mysql.createPool(cfg);

// Setup basic search API to find available quarters
var api = require('./api/app');
var base = api(pool);

base.get('webSocProvider').getSearchableQuarters(function(err, quarters) {
    app.set('quarters', []);
    app.configure(function() {
        app.set('port', 3000);
        app.use(express.logger());
        app.use(express.bodyParser());
        app.use(app.router);
        app.use(express.static("./../client/public"));

        quarters.forEach(function(row) {
            // Create an API for each available quarter
            app.get('quarters').push(row);
            app.use('/' + row.quarter, api(pool, row.quarter));
        });
    });

    app.configure('production', function() {
        app.set('port', 82);
    });

    // Route includes
    var quarters = require('./routes/quarters');

    // Verbs
    app.get('/quarters', quarters);

    // Port
    app.listen(app.get('port'));
});

