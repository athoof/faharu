var r = require('rethinkdb');
var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var connection;

/* GET home page. */
router.get('/', function(req, res, next) {
	r.connect({db: 'vedi'}, (err, conn) => {
		if (err) throw err;
		r.table('userLocation').run(conn, (err, cursor) => {
			if (err) throw err;
			// console.log('whoops');
			cursor.each((err, item) => {
				if (err) throw err;
				console.log(item);
			})
		})
	});
  	res.render('map', { title: 'Map' });
});

module.exports = router;
