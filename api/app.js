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
    app.param('dept_id', loader.loadCoursesByDeptId.bind(loader));
    app.param('course_id', loader.loadSectionsByCourseId.bind(loader));

    // Routes
    var section = require('./routes/section');
    var courses = require('./routes/courses');
    var sections = require('./routes/sections');
    var search = require('./routes/search');

    app.get('/section/:ccode(\\d+)', section);
    app.get('/courses/:dept_id(\\d+)', courses);
    app.get('/sections/:course_id(\\d+)', sections);
    app.get('/search/:query', search);

    return app;
}

