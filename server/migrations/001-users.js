var connection = require('./../db/connection');

exports.up = function(next){
  connection.query('CREATE TABLE users ( \
                      id INT NOT NULL AUTO_INCREMENT, \
                      email VARCHAR(40) NOT NULL, \
                      firstname VARCHAR(20) NOT NULL, \
                      lastname VARCHAR(20) NOT NULL, \
                      password CHAR(60) NOT NULL, \
                      PRIMARY KEY (id), \
                      UNIQUE KEY users_key (email) \
                    )', function(err, results) {
    if (err) throw err;

    next();
  });

};

exports.down = function(next){
  connection.query('DROP TABLE users', function (err, results) {
    if (err) throw err;

    next();
  })
};
