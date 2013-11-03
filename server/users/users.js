var provider = require('./provider');
var bcrypt = require('bcrypt');

module.exports = {
  register: function(email, password, firstname, lastname) {
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(password, salt);
    return provider.register(email, hash, firstname, lastname).then(
      function(result) {
        return {
          id: result.insertId,
          email: email,
          firstname: firstname,
          lastname: lastname
        };
      }
    );
  },

  login: function(email, password) {
    return provider.getUserByEmail(email).then(function(user) {
      if (!bcrypt.compareSync(password, user.password)) throw new PasswordError();
      return {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname
      }
    });
  }
}