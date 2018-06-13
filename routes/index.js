var express = require('express');
var router = express.Router();
var jwt = require('../CommonFunction/jwt');

/* GET home page. */
router.get('/', function (req, res, next) {
  var token = req.cookies.jwt;
  if (token) {
    var payload = jwt.decode(token);
    res.render('login', { title: payload.userName });
  }
  else
    res.render("login")
});

router.get('/apply',(req,res,next)=>{
  res.render('apply');
})

module.exports = router;
