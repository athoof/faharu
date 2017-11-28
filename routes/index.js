var r = require('rethinkdb');

var express = require('express');
var router = express.Router();

var bodyParser = require('body-parser');
var connection;
var apk = 'odi-1.7.3-release.apk';
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Faharu', apk: apk });
});

router.get('/download', (req, res) => {
	var file = 'public/downloads/'+apk;
	res.download(file);
	// res.render('index', { title: 'Faharu' });
});

module.exports = router;
