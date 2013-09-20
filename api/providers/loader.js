Loader = module.exports = function (provider) {
    this.provider = provider;
}

Loader.prototype.filterKeys = function (columns) {
    for (var i in columns) {
        if (i.slice(-2) == 'id') {
            delete columns[i];
        }
    }

    return columns;
}

Loader.prototype.loadQueryResult = function (req, res, next, query) {
    // Trim white-space
    query = query.trim();

    var containsNumbers = query.test(/\d+/);
    var containsLetters = query.test(/[a-z]|[A-Z]/);

    if (containsNumbers && containsLetters) {
        // Bio 94, CS 123
        // Give them the courses with sections sorted by department
    } else if (containsNumbers) {
        // Course code: 20315
        // Give them the course, sections, and the department
    } else if (containsLetters) {
        // Biological Sciences, AC ENG
        // Give them the departments, courses, and sections
    }
}

Loader.prototype.loadCcode = function (req, res, next, ccode) {
    this.provider.getAllByCcode(ccode, function (err, results) {
        if (err) {
            next(err);
        } else if (results) {
            req.params.course = this.filterKeys(results);
            next();
        } else {
            res.status(404);
            res.end();
        }
    }.bind(this));
}
