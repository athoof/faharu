var r = require('rethinkdb');

var express = require('express');
var router = express.Router();

var connection;
var connStatus = false;

r.connect({host: 'localhost', port: 28015}, function(err, conn) {
	if(err) throw err;
	connection = conn;
	connStatus = true;
});

router.post('/', function(req, res, next) {
	var Lat = req.body.Lat;
	var Lng = req.body.Lng;
	console.log("Latitude: " + Lat);
	console.log("Longitude: " + Lng);
	res.send('ok');
  // res.render('connectdb', { x: connStatus });
  //console.log(conn);
});

module.exports = router;
