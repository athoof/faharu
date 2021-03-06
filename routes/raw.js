var r = require('rethinkdb');
var _ = require('lodash');
var express = require('express');
var router = express.Router();

var x;

router.get('/', (req, res) => {
	r.connect({db: 'vedi'}, (err, conn) => {
		r.table('userLocation').eqJoin('user', r.db('vedi').table('user'))
		.without('id').zip()
		.pluck(['id', 'lastLocation', 'name', 'path'])
		.run(conn, (err, cursor) => {
			if (err) throw err;
			cursor.toArray((err, result) => {
				if (err) throw err;
				res.render('raw', {data: result});
				// y = _.orderBy(result, ['nodeNumber'], ['asc', 'desc'])
				// console.log(JSON.stringify(y, null, 2));
			});
		});
	});
	// res.render('display', {data: null});
});


module.exports = router;