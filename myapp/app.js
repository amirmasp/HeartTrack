const express = require('express');            
const bodyParser = require('body-parser');     // Parses JSON in body
const cookieParser = require('cookie-parser'); // Parses cookies
const logger = require('morgan');              // Logs requests & responses
const createError = require('http-errors');
const path = require('path'); 

let app = express();

let userRouter = require('./routes/users');
let deviceRouter = require('./routes/devices');
let argonRouter = require ('./routes/argon');
let physicianRouter = require ('./routes/physician');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// This is to enable cross-origin access
app.use(function (req, res, next) {
   // Website you wish to allow to connect
   res.setHeader('Access-Control-Allow-Origin', '*');
   // Request methods you wish to allow
   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
   // Request headers you wish to allow
   res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
   // Set to true if you need the website to include cookies in the requests sent
   // to the API (e.g. in case you use sessions)
   res.setHeader('Access-Control-Allow-Credentials', true);
   // Pass to next layer of middleware
   next();
});

// Include code for user defined routes
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Static file hosting
app.use(express.static('public'));

app.use('/users', userRouter);
app.use('/devices', deviceRouter);
app.use('/argon', argonRouter);
app.use('/physician', physicianRouter);

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// Error handler to return error as JSON data. 
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.send(JSON.stringify({
    message: err.message,
    status: err.status,
    stack: err.stack
  }));
});

module.exports = app;