var querystring = require('querystring');

Loader = module.exports = function (provider) {
    this.provider = provider;
}

Loader.prototype.onComplete = function (req, res, next, storage) {
    return function (err, results) {
        if (err) {
            next(err);
        } else if (results && ((Object.prototype.toString.call(results) !== '[object Array]') || (results.length > 0))) {
            req[storage] = results;
            next();
        } else {
            res.status(404);
            res.end();
        }
    }
}


Loader.prototype.loadQueryResult = function (req, res, next, query) {
    // Trim white-space
    query = querystring.unescape(query.trim().toLowerCase());

    var isLettersThanNumberRegex = /\w+\s\d+[a-z|A-Z]*$/;
    var isNumbersRegex = /^\d+$/;

    var isLettersThanNumber = isLettersThanNumberRegex.test(query);
    var isNumbers = isNumbersRegex.test(query);
    if (isLettersThanNumber) {
        // Bio 94, CS 123, Bio Sci 93
        // Give them the courses with sections sorted by department
        var separate = function (haystack) {
            var index = haystack.search(/\s\d+[a-z|A-Z]*$/);
            var number = haystack.slice(index + 1);
            var department = haystack.slice(0, index + 1).trim();

            var terms = department.split(' ');

            return [terms, number];
        }

        query = separate(query);

        req.type = 1;
        this.provider.findCoursesByWildcard(query, this.onComplete(req, res, next, 'results').bind(this));
    } else if (isNumbers) {
        // Course code: 20315
        // Give them the course, sections, and the department
        req.type = 2;
        this.provider.getAllByCcode(query, this.onComplete(req, res, next, 'results').bind(this));
    } else {
        // Department search
        req.type = 0;
        this.provider.findDepartmentsByWildcard(query.split(' '), this.onComplete(req, res, next, 'results').bind(this));
    }
}

Loader.prototype.loadCcode = function (req, res, next, ccode) {
    this.provider.getAllByCcode(ccode, this.onComplete(req, res, next, 'course'));
}

Loader.prototype.loadCoursesByDeptId = function (req, res, next, dept_id) {
    this.provider.getCoursesByDepartmentId(dept_id, this.onComplete(req, res, next, 'courses'));
}

Loader.prototype.loadSectionsByCourseId = function (req, res, next, course_id) {
    this.provider.getSectionsByCourseId(course_id, this.onComplete(req, res, next, 'sections'));
}
