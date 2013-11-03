var connection = require('./../db/connection');
var Q = require('q');

module.exports = {
  register: function(email, hash, firstname, lastname) {
    var sql = ' \
      INSERT INTO users (email, firstname, lastname, password) \
      VALUES (?, ?, ?, ?)';

    return Q.ninvoke(connection, 'query', sql, [email, firstname, lastname, hash]).then(
      function(result) {
        // connection.query's callback is variadic. Normally it calls it with 3 arguments,
        // so Q promises will delegate the first one (err) to a rejection,
        // and the last two together as an array to the resolution. We are interested
        // in only the second argument.
        return result[0];
      }
    );
  },

  getUserByEmail: function(email) {
    var sql = ' \
      SELECT id, email, password, firstname, lastname \
      FROM users \
      WHERE email = ?';

    return Q.ninvoke(connection, 'query', sql, [email]).then(function(result) {
      // select 1;
      return result[0][0];
    });
  }
}