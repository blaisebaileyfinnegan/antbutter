#!/usr/bin/env node

var express = require('express');
var app = express();

// Set up database
var mysql = require('mysql');
var cfg = require('./cfg/db');
var pool = mysql.createPool(cfg);

// Authentication
var passport = require('passport');
var auth = require('./authentication/auth');
var local = require('./authentication/local');

// Users
var users = require('./users/users');

// Setup basic search API to find available quarters
var api = require('./api/app');
var base = api(pool);

base.get('webSocProvider').getSearchableQuarters(function(err, quarters) {
  app.set('quarters', []);
  app.configure(function() {
    app.set('port', 3000);
    app.use(express.logger());
    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(express.session({secret: 'johnmayer'}));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
    app.use(express.static("./../client/public"));

    quarters.forEach(function(row) {
      // Create an API for each available quarter
      app.get('quarters').push(row);
      app.use('/' + row.quarter, api(pool, row.quarter));
    });
  });

  app.configure('production', function() {
    app.set('port', 90);
  });

  local.setup(app, passport);
  app.set('passport', passport);

  // Route includes
  var quarters = require('./routes/quarters');
  var status = require('./routes/status');
  var account = require('./routes/account');
  var register = require('./routes/register');
  var login = require('./routes/login');
  var logout = require('./routes/logout');

  // Verbs
  app.get('/auth/logout', logout);
  app.post('/auth/login', passport.authenticate('local'), login);
  app.get('/quarters', quarters);
  app.get('/account', auth.ensureAuthenticated, account);
  app.get('/auth/status', status);
  app.post('/auth/register', register);

  // Port
  app.listen(app.get('port'));
});
