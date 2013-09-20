var express = require('express');
module.exports = function (db, quarter) {
    var app = express();

    // Our DB was injected in the main app
    var WebSocProvider = require('./providers/websoc.provider');
    var Loader = require('./providers/loader');

    var webSocProvider = new WebSocProvider(db, quarter);
    app.set('webSocProvider', webSocProvider);

    var loader = new Loader(webSocProvider);

    // Route variable converters
    app.param('ccode', loader.loadCcode.bind(loader));

    // Routes
    var section = require('./routes/section');

    app.get('/section/:ccode(\\d+)', section);

    return app;
}

