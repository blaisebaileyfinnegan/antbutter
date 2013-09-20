var querystring = require('querystring');

Loader = module.exports = function (provider) {
    this.provider = provider;
}

Loader.prototype.loadQueryResult = function (req, res, next, query) {
    // Trim white-space
    query = querystring.unescape(query.trim().toLowerCase());

    var isLettersThanNumberRegex = /\w+\s\d+[a-z|A-Z]*$/;
    var isNumbersRegex = /^\d+$/;

    var isLettersThanNumber = isLettersThanNumberRegex.test(query);
    var isNumbers = isNumbersRegex.test(query);

    var onComplete = function (err, results) {
        if (err) {
            next(err);
        } else if (results && ((Object.prototype.toString.call(results) !== '[object Array]') || (results.length > 0))) {
            req.results = results;
            next();
        } else {
            res.status(404);
            res.end();
        }
    }

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

        this.provider.findCoursesByWildcard(query, onComplete);
    } else if (isNumbers) {
        // Course code: 20315
        // Give them the course, sections, and the department
        this.provider.getAllByCcode(query, onComplete);
    } else {
        // Department search
        this.provider.findDepartmentsByWildcard(query.split(' '), onComplete);
    }
}

Loader.prototype.loadCcode = function (req, res, next, ccode) {
    this.provider.getAllByCcode(ccode, function (err, results) {
        if (err) {
            next(err);
        } else if (results) {
            req.params.course = results;
            next();
        } else {
            res.status(404);
            res.end();
        }
    }.bind(this));
}
