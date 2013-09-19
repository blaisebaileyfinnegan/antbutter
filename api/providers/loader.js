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

Loader.prototype.loadCcode = function (req, res, next, ccode) {
    this.provider.getAllByCcode(ccode, function (err, results) {
        if (err) {
            next(err);
        } else if (results) {
            req.params.course = this.filterKeys(results);
            next();
        } else {
            next(new Error('No such course with ccode: ' + ccode));
        }
    }.bind(this));
}
