var r = require('rethinkdb');

var express = require('express');
var router = express.Router();

var bodyParser = require('body-parser');
var connection;
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Faharu' });
});

router.get('/download', (req, res) => {
	var file = 'public/downloads/odi_1.2.apk';
	res.download(file);
	// res.render('index', { title: 'Faharu' });
});

module.exports = router;
