var r = require('rethinkdb');
var _ = require('lodash');
var express = require('express');
var router = express.Router();

var x;

router.get('/', (req, res) => {
	r.connect({db: 'vedi'}, (err, conn) => {
		r.table('userLocation').run(conn, (err, cursor) => {
			if (err) throw err;
			cursor.toArray((err, result) => {
				if (err) throw err;
				// console.log(JSON.stringify(result, null, 2));
				x = result;
				// console.log(JSON.stringify(x));
				y = _.orderBy(result, ['nodeNumber'], ['asc', 'desc'])
				console.log(JSON.stringify(y, null, 2));
			});
		});
	});
	res.render('display', {data: y, data2: y});
});


module.exports = router;