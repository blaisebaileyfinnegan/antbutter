module.exports = function (req, res) {
    var payload = {
        courses: req.courses,
        departments: req.departments,
        instructors: req.instructors,
        places: req.places
    }

    res.json(payload);
}
