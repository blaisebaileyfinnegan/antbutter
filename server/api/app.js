var express = require('express');
module.exports = function (pool, quarter) {
    var app = express();

    // Setup
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

    var meetingsLoader = loader.loadMeetingsBySectionId.bind(loader);
    var finalLoader = loader.loadFinalBySectionId.bind(loader);
    var instructorsLoader = loader.loadInstructorsBySectionId.bind(loader);
    var instructorCoursesLoader = loader.loadCoursesByInstructorId.bind(loader);

    // Routes
    var section = require('./routes/section');
    var courses = require('./routes/courses');
    var sections = require('./routes/sections');
    var search = require('./routes/search');
    var meetings = require('./routes/meetings');
    var final = require('./routes/final');
    var instructors = require('./routes/instructors');
    var instructorCourses = require('./routes/instructor/courses');

    // Expose API verbs
    app.get('/section/:ccode(\\d+)', section);
    app.get('/courses/:dept_id(\\d+)', courses);
    app.get('/sections/:course_id(\\d+)', sections);
    app.get('/meetings/:section_id(\\d+)', meetingsLoader, meetings);
    app.get('/final/:section_id(\\d+)', finalLoader, final);
    app.get('/search/:query', search);
    app.get('/instructors/:section_id(\\d+)', instructorsLoader, instructors);
    app.get('/instructor/courses/:instructor_id(\\d+)', instructorCoursesLoader, instructorCourses);

    return app;
}

