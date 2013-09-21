module.exports = function (req, res) {
    res.json(req.app.get('quarters'));
}
