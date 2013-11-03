module.exports = function (req, res) {
  var payload = '0';
  if (req.isAuthenticated()) {
    payload = req.user;
  }

  res.send(payload);
}