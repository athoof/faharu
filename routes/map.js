var r = require('rethinkdb');
var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var connection;

/* GET home page. */
router.get('/', function(req, res, next) {
	r.connect({db: 'vedi'}, (err, conn) => {
		if (err) throw err;
		r.table('user').run(conn, (err, result) => {
			if (err) throw err;
			if (result != null && typeof result != 'undefined') {
				console.log('Loading users and their last known locations');
				result.toArray((err, r) => {
					if (err) throw err;
					// console.log(r);
					res.render('map', {title: 'Map', users: r });
				})
			} else {
				console.log('No users');
  				res.render('map', { title: 'Map'});
			}
		})
	});
});

module.exports = router;
