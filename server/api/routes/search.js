module.exports = function (req, res) {
    var payload = {
        courses: req.courses,
        departments: req.departments,
        instructors: req.instructors
    }

    res.json(payload);
}
