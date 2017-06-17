var r = require('rethinkdb');

var express = require('express');
var router = express.Router();
// var Location = require('location.js');

var connection;
var connStatus = false;
var pathArray = [];
var path = [];

class Location {
	constructor(latitude, longitude) {
		this.latitude = latitude;
		this.longitude = longitude;
	}
}

// module.exports = Location;



router.post('/', function(req, res) {
	var recording = req.body.recording;
	var latitude = req.body.latitude ? req.body.latitude : '0';
	var longitude = req.body.longitude ? req.body.latitude : '0';
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
	path = [];
}

function save() {
	r.connect({host: 'localhost', port: 28015}, function(err, conn) {
		if(err) throw err;
		connection = conn;
		conn ? connStatus = true : connStatus = false;
	});
	console.log(JSON.stringify(path))
	path.forEach((p, index) => {
		r.table('userLocations').insert([
			{
				nodeNumber: index,
				location: [
					{latitude: p.latitude},
					{longitude: p.longitude}
				]
			}
		])
	})	
	// r.table('userLocations').insert([
	// 		{
	// 			location: [
	// 				latitude: 
	// 			]
	// 		}
	// 	])
}

module.exports = router;
