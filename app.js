var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var connect = require('connect');
var vhost = require('vhost');

var index = require('./routes/index');
var connectdb = require('./routes/connectdb');
var save = require('./routes/save');
var display = require('./routes/display');
var map = require('./routes/map');
var client = require('./routes/client');
var socket = require('./routes/socket');
var users = require('./routes/users');

var app = express();

app.use(vhost('vidhaafaiy.com', require('./vidhaafaiy/app')))//for a different project
// app.use(router);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/connectdb', connectdb);
app.use('/save', save);
app.use('/display', display);
app.use('/map', map);
app.use('/client', client);
app.use('/socket', socket);
app.use('/users', users);

var sess = {
	secret: 'faharu',
	cookie: {}
}
app.use(session(sess));
// console.log(session)


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
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
