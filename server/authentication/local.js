var LocalStrategy = require('passport-local').Strategy;
var connection = require('./../db/connection');
var users = require('./../users/users');

module.exports = local = {
  setup: function(app, passport) {
    passport.serializeUser(function(user, done) {
      done(null, user);
    });

    passport.deserializeUser(function(user, done) {
      done(null, user);
    });

    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
      },
      function(email, password, done) {
        users.login(email, password).then(function(user) {
          done (null, user);
        }, function () {
          done(null, false);
        });
      }
    ));
  }
};