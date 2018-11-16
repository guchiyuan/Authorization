var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');

var indexRouter = require('./server/routes/index');
// var apisRouter=require('./server/routes/api_重构之前');
var wechatRouter=require('./server/routes/wechat');
var commonRouter=require('./server/routes/common');
var applyRouter=require('./server/routes/apply');
var checkRouter=require('./server/routes/check');
var adminRouter=require('./server/routes/admin');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/wechatsq',wechatRouter);
app.use('/test',commonRouter);
app.use('/test',applyRouter);
app.use('/test',checkRouter);
app.use('/test',adminRouter);

//正式线上环境
// app.use('/testapi',commonRouter);
// app.use('/testapi',applyRouter);
// app.use('/testapi',checkRouter);
// app.use('/testapi',adminRouter);

app.use(function(err,req,res,next){
  res.json(err.message);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
