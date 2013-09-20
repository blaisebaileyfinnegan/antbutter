WebSocProvider = module.exports = function (connection, termCode) {
    this.connection = connection;
    this.termCode = termCode;
}


WebSocProvider.prototype.retrieveOne = function(callback) {
    return function(err, results) {
        if (err) throw err;

        if (results.length > 0) {
            callback(null, results[0]);
        } else {
            callback(null, undefined);
        }
    }
}

/**
 * @param int ccode
 *
 * @return
 */
WebSocProvider.prototype.getCourseByCcode = function (ccode, callback) {
    var sql = 'SELECT c.course_id, c.dept_id, c.number, c.title FROM courses as c INNER JOIN sections as s ON s.course_id = c.course_id INNER JOIN departments as d ON d.dept_id = c.dept_id WHERE s.ccode = ? AND d.quarter = ?';

    this.connection.query(sql, [ccode, this.termCode], this.retrieveOne(callback));
}

/**
 * @param int ccode
 *
 * @return
 */
WebSocProvider.prototype.getSectionByCcode = function (ccode, callback) {
    var sql = 'SELECT s.section_id, s.ccode, s.course_id, s.type, s.section, s.units, s.instructor, s.max, s.enrolled, s.req, s.restrictions, s.textbooks, s.web, s.status FROM sections as s INNER JOIN courses as c ON c.course_id = s.course_id INNER JOIN departments as d ON d.dept_id = c.dept_id WHERE s.ccode = ? AND d.quarter = ?';

    this.connection.query(sql, [ccode, this.termCode], this.retrieveOne(callback));
}

/**
 * @param int ccode
 *
 * @return Object containing dept, course, and section properties excluding time
 */
WebSocProvider.prototype.getAllByCcode = function (ccode, callback) {
    var sql = 'SELECT d.dept_id, d.quarter, d.short_name, d.college_title, d.college_comment, d.dept_title, d.dept_comment, c.course_id, c.number, c.title, s.section_id, s.ccode, s.course_id, s.type, s.section, s.units, s.instructor, s.max, s.enrolled, s.req, s.restrictions, s.textbooks, s.web, s.status FROM sections as s INNER JOIN courses as c ON c.course_id = s.course_id INNER JOIN departments as d ON d.dept_id = c.dept_id WHERE s.ccode = ? AND d.quarter = ?';

    this.connection.query(sql, [ccode, this.termCode], this.retrieveOne(callback));
}

/**
 * @return Array of term codes
 */
WebSocProvider.prototype.getSearchableQuarters = function (callback) {
    var sql = 'SELECT distinct(quarter) FROM departments';

    this.connection.query(sql, function (err, rows) {
        if (err) throw err;

        callback(null, rows);
    });
}
