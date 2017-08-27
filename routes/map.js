var r = require('rethinkdb');
var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var connection;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('map', { title: 'Map' });
});

module.exports = router;
