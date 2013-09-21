module.exports = function (req, res) {
    req.results.unshift(req.type);
    res.json(req.results);
}
