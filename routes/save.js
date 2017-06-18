var r = require('rethinkdb');
var _ = require('lodash');

var express = require('express');
var router = express.Router();
// var Location = require('location.js');
var connection;
var connStatus = false;
var pathArray = [];
var path = [];
var x;
class Location {
	constructor(latitude, longitude) {
		this.latitude = latitude;
		this.longitude = longitude;
	}
}

// module.exports = Location;

router.get ('/drop', (req, res) => {
	r.connect({db: 'vedi'}, (err, conn) => {
		r.db('vedi').tableList().run(conn, (err, res) => {
			if (err) throw err;
			if (!_.find(res, ['userLocation'])) {
				console.log('Exists. Dropping...')
				r.db('vedi').tableDrop('userLocation').run(conn, () => {
					console.log('Dropped \'userLocation\' in Vedi');
					r.db('vedi').tableCreate('userLocation').run(conn, (err, res) => {
						if (err) throw err;
						console.log(res);
					})
				});
			} else {
				console.log('Does not exist, creating...')
				r.db('vedi').tableCreate('userLocation').run(conn, (err, res) => {
					if (err) throw err;
					console.log(res);
				})
			}
		})
			// })
		res.send('ok')
	})
})

router.get('/', (req, res) => {
	r.connect({db: 'vedi'}, (err, conn) => {
		r.table('userLocation').run(conn, (err, cursor) => {
			if (err) throw err;
			cursor.toArray((err, result) => {
				if (err) throw err;
				x=result 
				// res.send(JSON.stringify(result[0], null, 2))
				console.log(result.length);
				result.forEach((r, index) => {
					// if (r.pathNumber.length)
					// console.log(r.length);
				})
				// console.log(JSON.stringify(result, null, 2));
				res.send('ok')
			});
		});
	});
	// res.render('display', {data: y, data2: x});
});

router.post('/', function(req, res) {

	var recording = req.body.recording;
	var latitude = req.body.latitude ? req.body.latitude : '0';
	var longitude = req.body.longitude ? req.body.longitude : '0';
	/*if (req.body.latitude && req.body.longitude) {
		
		var p = new Path(latitude, longitude, recording);
	} else {
		if (req.body.recording && p == null) {
			var p = new Path(null, null, recording);
		}
	}*/

	var L = new Location(latitude, longitude);
	// console.log(L);

	if (req.body.recording) {
		path.push([L, false]);
	} else {
		path.push([L, true]);
	}

	let i = path.length - 1;
	
	if (i == 0 && path[i][1] == true) {
		console.log('Begin recording');
	}

	if (!path[i][1]) {
		stopRecording(i);
		console.log('Stop recording');
	}

	console.log('#' + i + ' | ' + L.latitude + ', ' + L.longitude);

	// console.log(path[i][1]);
	// console.log(p);
	// console.log('Status: ' + connStatus);
	// console.log('Recording: ' + recording  + '\n' + 'Latitude: ' + latitude + ', Longitude: ' + longitude)
	// pathArray.push(p);
	// console.log(pathArray);
	res.send('ok');
})

function stopRecording(lastLocation) {
	console.log('Stopped recording on #' + lastLocation);
	save();
	// path = [];
}

function save() {
	console.log('Saving...')
	r.connect({host: 'localhost', port: 28015, db: 'vedi'}, function(err, conn) {
		if(err) throw err;
		connection = conn;

		r.table('userLocation').run(conn, (err, conn) => {
			if (err) throw err;
			cursor.toArray((err, result) => {
				if (err) throw err;
				if (result.length > 0) {
					pathInsert(result.length);
				}
			})
		})
	})
};

function pathInsert(pathNumber) {
	r.connect({db: 'vedi'}, (err, conn) => {
		if (err) throw err;
		path.forEach((p, index) => {
			r.table('userLocation').insert([			
					{
						pathNumber: pathNumber,
						path: {
							nodeNumber: index,
							location: [
								{latitude: p[0].latitude},
								{longitude: p[0].longitude}
							]
						}
					}
				]).run(connection, function(err, result){
					if (err) throw err;
					console.log(JSON.stringify(result, null, 2));
				})
		})
	})
}


		// conn ? connStatus = true : connStatus = false;
	// console.log(JSON.stringify(path))
	// r.table('userLocations').insert([
	// 		{
	// 			location: [
	// 				latitude: 
	// 			]
	// 		}
	// 	])

module.exports = router;
