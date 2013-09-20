var express = require('express');
module.exports = function (pool, quarter) {
    var app = express();

    // Our DB was injected in the main app
    var WebSocProvider = require('./providers/websoc.provider');
    var Loader = require('./providers/loader');

    var webSocProvider = new WebSocProvider(pool, quarter);
    app.set('webSocProvider', webSocProvider);

    var loader = new Loader(webSocProvider);

    // Route variable converters
    app.param('ccode', loader.loadCcode.bind(loader));
    app.param('query', loader.loadQueryResult.bind(loader));

    // Routes
    var section = require('./routes/section');
    var search = require('./routes/search');

    app.get('/section/:ccode(\\d+)', section);
    app.get('/search/:query', search);

    return app;
}

