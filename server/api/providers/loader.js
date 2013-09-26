var querystring = require('querystring');
var async = require('async');

Loader = module.exports = function (provider) {
    this.provider = provider;
}

Loader.prototype.onComplete = function (req, res, next, storage) {
    return function (err, results) {
        if (err) {
            next(err);
        } else if (results && ((Object.prototype.toString.call(results) !== '[object Array]') || (results.length > 0))) {
            if (!storage) {
                for (var key in results) {
                    req[key] = results[key];
                }
            } else {
                req[storage] = results;
            }

            next();
        } else {
            res.status(204);
            res.end();
        }
    }
}


Loader.prototype.loadQueryResult = function (req, res, next, query) {
    // Trim white-space
    query = querystring.unescape(query.trim().toLowerCase());

    var isLettersThanNumberRegex = /\w+\s\d+[a-z|A-Z]*$/;
    var isNumbersRegex = /^\d+$/;

    /**
     * This section is course-related. We consider the search distinct in this category (it can only be one of three things)
     */
    var isLettersThanNumber = isLettersThanNumberRegex.test(query);
    var isNumbers = isNumbersRegex.test(query);

    var taskComplete = function (callback) {
        return function (err, results) {
            if (err) throw err;

            callback(null, results);
        }
    }

    async.parallel({
        courses: function (callback) {
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

                this.provider.findCoursesByWildcard(query, taskComplete(callback));
            } else if (isNumbers) {
                // Course code: 20315
                // Give them the course, sections, and the department
                this.provider.getAllByCcode(query, taskComplete(callback));
            } else {
                callback(null, []);
            }
        }.bind(this),

        departments: function (callback) {
            if (!isLettersThanNumber && !isNumbers) {
                // Department search
                this.provider.findDepartmentsByWildcard(query.split(' '), taskComplete(callback));
            } else {
                callback(null, []);
            }
        }.bind(this),

        /**
         * In addition to searching the course catalog, let's throw in some instructor searches
         */
        instructors: function (callback) {
            // Instructor search
            this.provider.findInstructorsByWildcard(query, taskComplete(callback));
        }.bind(this),

        /**
         * Location searching
         */
        places: function (callback) {
            this.provider.findPlacesByWildcard(query, taskComplete(callback));
        }.bind(this)
    },
    function (err, results) {
        this.onComplete(req, res, next)(err, results);
    }.bind(this));

   //if (!isNumbers) {
    //    this.provider.findInstructorsByWildcard(this.onComplete(req, res, next, 'instructors').bind(this));
    //}
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

Loader.prototype.loadMeetingsBySectionId = function (req, res, next) {
    this.provider.getMeetingsBySectionId(req.params.section_id, this.onComplete(req, res, next, 'meetings'));
}

Loader.prototype.loadFinalBySectionId = function (req, res, next) {
    this.provider.getFinalBySectionId(req.params.section_id, this.onComplete(req, res, next, 'final'));
}

Loader.prototype.loadInstructorsBySectionId = function (req, res, next) {
    this.provider.getInstructorsBySectionId(req.params.section_id, this.onComplete(req, res, next, 'instructors'));
}
