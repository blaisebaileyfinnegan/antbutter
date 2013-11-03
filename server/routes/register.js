var users = require('./../users/users');
var check = require('validator').check;

module.exports = function(req, res, next) {
  var passport = req.app.get('passport');

  var email = req.body.email;
  var password = req.body.password;
  var firstname = req.body.firstname;
  var lastname = req.body.lastname;

  try {
    check(email).notNull().len(6, 40).isEmail();
    check(password).notNull().len(6, 255);
    check(firstname).notNull().len(1, 40).isAlpha();
    check(lastname).notNull().len(1, 40).isAlpha();
  } catch (e) {
    res.json(400, { message: 'Your request was malformed.' });
    return;
  }

  users.register(email, password, firstname, lastname).then(
    function(user) {
      // Log the user in
      req.login(user, function(err) {
        if (err) {
          return next(err);
        }

        return res.json(user);
      });
    },
    function(error) {
      if (error.code == 'ER_DUP_ENTRY') {
        res.json(400, { message: 'That e-mail already exists in our database.' });
      } else {
        res.json(400, { message: 'There was an error processing your registration.'})
      }
    }
  );
}