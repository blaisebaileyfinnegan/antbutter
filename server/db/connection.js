// Output dependencies
var mysql = require('mysql');
var cfg = require('./../cfg/db');
module.exports = mysql.createConnection(cfg);
