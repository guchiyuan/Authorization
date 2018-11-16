var express = require('express');
var router = express.Router();
var jwt = require('../common_function/jwt');

/* GET home page. */
router.get('/sqxt', function (req, res, next) {
  var token = req.cookies.jwt;
  if (token) {
    var payload = jwt.decode(token);
    res.render('login', { title: payload.userName });
  }
  else
    res.render("login")
});

module.exports = router;
