WebSocProvider = module.exports = function (pool, termCode) {
    this.pool = pool;
    this.termCode = termCode;

    this.COURSE_CODE = 0;
    this.DEPARTMENT_NAME = 1;
    this.DEPARTMENT_AND_COURSE_NUMBER = 2;
}

WebSocProvider.prototype.retrieveAll = function(sql, params, callback) {
    this.pool.getConnection(function(err, connection) {
        connection.query(sql, params, function (err, results) {
            if (err) throw err;

            connection.release();

            callback(null, results);
        });
    }.bind(this));
}

WebSocProvider.prototype.retrieveOne = function(sql, params, callback) {
    this.pool.getConnection(function(err, connection) {
        connection.query(sql, params, function (err, results) {
            if (err) throw err;

            if (results.length > 0) {
                callback(null, results[0]);
            } else {
                callback(null, undefined);
            }

            connection.release();

        });
    }.bind(this));
}

WebSocProvider.prototype.prepareTerms = function(terms) {
    terms = terms.map(function (element) {
        return '%' + element + '%';
    });

    terms.forEach(function (element, index, array) {
        array.splice(index + 1, 0, element);
    });

    return terms;
}

WebSocProvider.prototype.buildDeptClause = function(terms) {
    var clauses = []
    terms.forEach(function(element) {
            clauses.push('(LOWER(d.short_name) LIKE ? OR LOWER(d.dept_title) LIKE ?)');
    });

    return clauses.join(' AND ');
}

WebSocProvider.prototype.getCoursesByInstructorId = function (instructorId, callback) {
    var sql = 'SELECT c.course_id, c.short_name, c.number, c.title FROM sections as s INNER JOIN sections2instructors as s2i ON s2i.section_id = s.section_id INNER JOIN instructors as i ON i.instructor_id = s2i.instructor_id INNER JOIN courses as c ON c.course_id = s.course_id WHERE i.instructor_id = ?';

    this.retrieveAll(sql, [instructorId], callback);
}

WebSocProvider.prototype.findCoursesByWildcard = function (terms, callback) {
    var sql = 'SELECT d.dept_id, d.quarter, d.short_name, d.college_title, d.college_comment, d.dept_title, d.dept_comment, c.course_id, c.number, c.title, count(s.section_id) as section_count FROM courses as c INNER JOIN departments2courses as d2c ON d2c.course_id = c.course_id INNER JOIN departments as d ON d2c.dept_id = d.dept_id INNER JOIN sections as s ON s.course_id = c.course_id WHERE ' + this.buildDeptClause(terms[0]) + ' AND LOWER(c.number) LIKE ? AND d.quarter = ? GROUP BY c.course_id ORDER BY d.short_name ASC';

    terms[0] = this.prepareTerms(terms[0]);

    var params = [terms[1] + "%", this.termCode];

    this.retrieveAll(sql, terms[0].concat(params), callback);
}

WebSocProvider.prototype.getMeetingsBySectionId = function (section_id, callback) {
    var sql = 'SELECT m.meeting_id, m.section_id, m.start, m.end, m.place, m.sunday, m.monday, m.tuesday, m.wednesday, m.thursday, m.friday, m.saturday FROM meetings as m INNER JOIN sections as s ON s.section_id = m.section_id WHERE s.section_id = ?';

    this.retrieveAll(sql, [section_id], callback);
}

WebSocProvider.prototype.findInstructorsByWildcard = function (term, callback) {
    var sql = 'SELECT i.instructor_id, i.name FROM instructors as i INNER JOIN sections2instructors as s2i ON s2i.instructor_id = i.instructor_id WHERE LOWER(i.name) LIKE ? AND i.name <> "staff" GROUP BY i.instructor_id ORDER BY i.name ASC LIMIT 100';

    term = "%" + term + "%";

    this.retrieveAll(sql, [term], callback);
}

WebSocProvider.prototype.findPlacesByWildcard = function(term, callback) {
    var sql = 'SELECT p.place_id, p.latitude, p.longitude, p.name, p.type FROM places as p WHERE LOWER(name) LIKE ? ORDER BY p.name ASC LIMIT 50';

    term = "%" + term + "%";

    this.retrieveAll(sql, [term], callback);
};

WebSocProvider.prototype.getFinalBySectionId = function (section_id, callback) {
    var sql = 'SELECT f.final_id, f.section_id, f.day, f.start, f.end FROM finals as f INNER JOIN sections as s ON s.section_id = f.section_id WHERE s.section_id = ?';

    this.retrieveAll(sql, [section_id], callback);
}

/**
 * One big mega join. DO NOT USE! The client can't handle all of this data
 */
WebSocProvider.prototype.findAllByWildcard = function (wildcard, type, callback) {
    var sql = 'SELECT d.dept_id, d.quarter, d.short_name, d.college_title, d.college_comment, d.dept_title, d.dept_comment, c.course_id, c.number, c.title, s.section_id, s.ccode, s.type, s.section, s.units, s.max, s.enrolled, s.req, s.restrictions, s.textbooks, s.web, s.status, f.final_id, f.day as final_day, f.start as final_start, f.end as final_end, m.meeting_id, m.start as meeting_start, m.end as meeting_end, m.sunday as sunday, m.monday as monday, m.tuesday as tuesday, m.wednesday as wednesday, m.thursday as thursday, m.friday as friday, m.saturday as saturday FROM departments as d INNER JOIN departments2courses as d2c ON d2c.dept_id = d.dept_id INNER JOIN courses as c ON d2c.course_id = c.course_id INNER JOIN sections as s ON c.course_id = s.course_id INNER JOIN meetings as m ON m.section_id = s.section_id INNER JOIN finals as f ON f.section_id = s.section_id WHERE ';

    var params = [];
    switch (type) {
        case this.COURSE_CODE:
            sql = sql + 'c.ccode = ?';
            params = [wildcard];
            break;
        case this.DEPARTMENT_NAME:
            wildcard = '%' + wildcard + '%';
            sql = sql + '(LOWER(d.short_name) LIKE ? OR LOWER(d.dept_title) LIKE ?)';
            params = [wildcard, wildcard];
            break;
        case this.DEPARTMENT_AND_COURSE_NUMBER:
            sql = sql + '(LOWER(d.short_name) LIKE ? OR LOWER(d.dept_title) LIKE ?) AND LOWER(c.number) LIKE ?';

            if (wildcard.length != 2) {
                throw new Error('findAllByWildcard expected 2 params and was given ' + wildcard.length);
            }

            params = [wildcard[0], wildcard[0], wildcard[1]];
            break;
        default:
            throw new Error('Unknown query type');
    }

    sql = sql + ' AND d.quarter = ?';
    params.push(this.termCode);

    this.retrieveAll(sql, params, callback);
}

/**
 * @param string wildcard
 */
WebSocProvider.prototype.findDepartmentsByWildcard = function (terms, callback) {
    var sql = 'SELECT d.dept_id, d.quarter, d.short_name, d.college_title, d.college_comment, d.dept_title, d.dept_comment FROM departments as d WHERE ' + this.buildDeptClause(terms) + ' AND d.quarter = ?';

    terms = this.prepareTerms(terms);
    this.retrieveAll(sql, terms.concat([this.termCode]), callback);
}

WebSocProvider.prototype.getCoursesByDepartmentId = function (id, callback) {
    var sql = 'SELECT c.course_id, c.number, c.title, count(s.section_id) as section_count FROM courses as c INNER JOIN departments2courses as d2c ON d2c.course_id = c.course_id INNER JOIN sections as s ON s.course_id = c.course_id WHERE d2c.dept_id = ? GROUP BY c.course_id';

    this.retrieveAll(sql, [id], callback);
}

WebSocProvider.prototype.getSectionsByCourseId = function (id, callback) {
    var sql = 'SELECT s.section_id, s.ccode, s.course_id, s.type, s.section, s.units, s.max, s.enrolled, s.req, s.restrictions, s.textbooks, s.web, s.status FROM sections as s WHERE s.course_id = ?';

    this.retrieveAll(sql, [id], callback);
}

/**
 * @param int ccode
 */
WebSocProvider.prototype.getCourseByCcode = function (ccode, callback) {
    var sql = 'SELECT c.course_id, c.dept_id, c.number, c.title FROM courses as c INNER JOIN sections as s ON s.course_id = c.course_id INNER JOIN departments2courses as d2c ON d2c.course_id = c.course_id INNER JOIN departments as d ON d.dept_id = d2c.dept_id WHERE s.ccode = ? AND d.quarter = ?';

    this.retrieveOne(sql, [ccode, this.termCode], callback);
}

/**
 * @param int ccode
 */
WebSocProvider.prototype.getSectionByCcode = function (ccode, callback) {
    var sql = 'SELECT s.section_id, s.ccode, s.course_id, s.type, s.section, s.units, s.max, s.enrolled, s.req, s.restrictions, s.textbooks, s.web, s.status FROM sections as s INNER JOIN courses as c ON c.course_id = s.course_id INNER JOIN departments2courses as d2c ON d2c.course_id = c.course_id INNER JOIN departments as d ON d.dept_id = d2c.dept_id WHERE s.ccode = ? AND d.quarter = ?';

    this.retrieveOne(sql, [ccode, this.termCode], callback);
}


/**
 * @param int ccode
 */
WebSocProvider.prototype.getAllByCcode = function (ccode, callback) {
    var sql = 'SELECT d.dept_id, d.quarter, d.short_name, d.college_title, d.college_comment, d.dept_title, d.dept_comment, c.course_id, c.number, c.title, s.section_id, s.ccode, s.course_id, s.type, s.section, s.units, s.max, s.enrolled, s.req, s.restrictions, s.textbooks, s.web, s.status, count.section_count as section_count FROM sections as s INNER JOIN courses as c ON c.course_id = s.course_id INNER JOIN departments2courses as d2c ON d2c.course_id = c.course_id INNER JOIN departments as d ON d.dept_id = d2c.dept_id, (SELECT count(s.section_id) as section_count FROM sections as s, (SELECT c.course_id FROM courses as c INNER JOIN sections as s ON s.course_id = c.course_id WHERE s.ccode = ?) target WHERE s.course_id = target.course_id) count WHERE s.ccode = ? AND d.quarter = ?';

    this.retrieveAll(sql, [ccode, ccode, this.termCode], callback);
}

WebSocProvider.prototype.getSearchableQuarters = function (callback) {
    var sql = 'SELECT q.quarter, q.year_term as yearTerm FROM quarters as q';

    this.retrieveAll(sql, [], callback);
}

WebSocProvider.prototype.getYearTerm = function (quarter, callback) {
    var sql = 'SELECT year_term as yearTerm FROM quarters WHERE quarter = ?';

    this.retrieveOne(sql, [quarter], callback);
}

WebSocProvider.prototype.getInstructorsBySectionId = function (section_id, callback) {
    var sql = 'SELECT i.instructor_id, i.name FROM instructors as i INNER JOIN sections2instructors as s2i ON s2i.instructor_id = i.instructor_id WHERE s2i.section_id = ?';

    this.retrieveAll(sql, [section_id], callback);

}
