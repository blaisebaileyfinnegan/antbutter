#!/usr/bin/env node

require('./environment');
var express = require('express');
var app = express();

// Templating engine
var swig = require('swig');
app.engine('html', swig.renderFile);

app.set('view engine', 'html');
app.set('views', __dirname + '/views');

// Set up database
var mysql = require('mysql');

var cfg = require('./cfg/dev_db');
app.set('port', 3000);

app.configure('production', function () {
    cfg = require('./cfg/db');
    app.set('port', 80);
});

var pool = mysql.createPool(cfg);

// Setup basic search API to find available quarters
var api = require('./api/app');
var base = api(pool);

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
            app.use('/' + row.quarter, api(pool, row.quarter));
        });
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

