var r = require('rethinkdb');
var _ = require('lodash');

var express = require('express');
var router = express.Router();
// var Location = require('location.js');
var connection;
var connStatus = false;
var currentID = 0;
var x;

class Node {
	constructor(latitude, longitude, nodeNumber, timestamp) {
		this.latitude = latitude;
		this.longitude = longitude;
		this.nodeNumber = nodeNumber;
		this.timestamp = timestamp;
	}
}

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
		res.send('ok')
	})
})

router.post('/updatepath', (req, res) => {
	var recording = req.body.recording;
	var latitude = req.body.latitude ? req.body.latitude : '0';
	var longitude = req.body.longitude ? req.body.longitude : '0';
	var user = req.body.user ? req.body.user : 'nouser';
	var nodeNumber = req.body.nodeNumber ? req.body.nodeNumber : '0';
	var timestamp = req.body.timestamp ? req.body.timestamp : '0';

	var L = new Node(latitude, longitude, nodeNumber, timestamp);
	// console.log (JSON.stringify(L));
	if (req.body.recording == true) {
		console.log('Adding node...');
		r.connect({db: 'vedi'}, (err, conn) => {
			if (err) throw err;
			if(currentID == 0 && nodeNumber == 0) {
				r.table('userLocation').insert({
					user: user,
					path: [{
						nodeNumber: nodeNumber,
						latitude: latitude,
						longitude: longitude,
						timestamp: timestamp,
					}]
				}).run(conn, (err, cursor) => {
					if (err) throw err;
					console.log('Inserted initial')
					currentID = cursor.generated_keys[0];
				})
			} else {
				r.table('userLocation').get(currentID).update({
					path: r.row("path").append({
						nodeNumber: nodeNumber,
						latitude: latitude,
						longitude: longitude,
						timestamp: timestamp,
					})
				}).run(conn, (err, res) => {
					if (err) throw err;
					console.log("Appended: " + JSON.stringify(res));
				})				
			}
		});
	} else {
		console.log('End path');
		r.connect({db: 'vedi'}, (err, conn) => {
			if (err) throw err;
			r.table('userLocation').filter((user) => {
				return user("name").eq(user.name);
			}).filter((path) => {
				return path("node").max("timestamp");
			}).insert([
				{
					nodeNumber: nodeNumber,
					latitude: latitude,
					longitude: longitude,
					timestamp: Math.floor(r.now() /1000),
				},

			])

		})
	}
});


router.post('/beginpath', (req, res) => {
	var recording = req.body.recording;
	var latitude = req.body.latitude ? req.body.latitude : '0';
	var longitude = req.body.longitude ? req.body.longitude : '0';
	var user = req.body.user ? req.body.user : 'nouser';
	// var nodeNumber = req.body.nodeNumber ? req.body.nodeNumber : '0';
	// var timestamp = req.body.timestamp ? req.body.timestamp : '0';

	// var L = new Node(latitude, longitude, nodeNumber, timestamp);

	if (req.body.recording == true) {
		console.log('Begin recording');
		r.connect({db: 'vedi'}, (err, conn) => {
			if (err) throw err;
			r.table('userLocation').insert(
				{
					user: user,
					path: [{ 
						nodeNumber: 0,
						latitude: latitude,
						longitude: longitude,
						// timestamp: Math.floor(r.now() /1000),
					}],
					// startTime: Math.floor(r.now()/1000),
				},
				{returnChanges: true}
			).run(conn, (err, result) => {
				if(err) throw err;
				ID = result.generated_keys;
				currentID = ID[0];
				console.log("Inserted: " + currentID)
			})
			// .run(conn, (err, result) => {
			// 		if (err) throw err;
			// 		result = _.orderBy(result, ['startTime'], ['asc']);
			// 		console.log('Created path #' + _.last(result).user,  );
			// })
		})
	}

});

router.post('/', function(req, res) {

	var recording = req.body.recording;
	var latitude = req.body.latitude ? req.body.latitude : '0';
	var longitude = req.body.longitude ? req.body.longitude : '0';
	var user = req.body.user ? req.body.user : 'nouser';
	var nodeNumber = req.body.nodeNumber ? req.body.nodeNumber : '0';
	var L = new Node(latitude, longitude, nodeNumber);

	// if (req.body.recording) {
	// 	path.push([L, false]);
	// } else {
	// 	path.push([L, true]);
	// }

	if (req.body.recording) {
		// console.log('Begin recording');
		nodeArray.push(L, user);
		console.log('#' + L.nodeNumber + ' | ' + L.latitude + ', ' + L.longitude + 'User: ' + user);

	}

	// let i = path.length - 1;
	
	// if (i == 0 && path[i][1] == true) {
	// 	console.log('Begin recording');
	// 	// startRecording(i);
	// 	i++;
	// }

	// if (!path[i][1]) { //if false/not recording
	// 	// stopRecording(i);
	// 	console.log('Stop recording');
	// 	console.log('#' + i + ' | ' + L.latitude + ', ' + L.longitude);
	// 	// i = 0;//reset iterator so next path begins with node #0
	// }


	// console.log(path[i][1]);
	// console.log(p);
	// console.log('Status: ' + connStatus);
	// console.log('Recording: ' + recording  + '\n' + 'Latitude: ' + latitude + ', Longitude: ' + longitude)
	// pathArray.push(p);
	// console.log(pathArray);
	res.send('ok');
})

/*
.run(conn, (err, cursor) => {
			if (err) throw err;
			cursor.toArray((err, result) => {
				if (err) throw err;
				let x = result.length;
				let pathNumber = pathNumber ? result[x].pathNumber+1 : 0;
				console.log('result pathNumber ' + x)
			})
		})
		*/

function getLatest(user) {
	r.connect ({db: 'vedi'}, (err, conn) => {
		if (err) throw err;
		r.table('userLocation').run(conn, (err, cursor) => {
			if(err) throw err;
			cursor.toArray((err, result) => {
				if (err) throw err;
				pathNumber = pathNumber ? result[x].pathNumber+1 : 0;
			})
		})
	})
}

function startRecording(firstNode) {
	r.connect({db: 'vedi'}, (err, conn) => {
		if (err) throw err;
		r.table('userLocation').insert({
				path: [],
			}).run(conn, (err, result) => {
			if (err) throw err;
			console.log('Created path ' + result.id);
		})
	})
}

function updatePath(pathID) {//has to work
	r.connect({db: 'vedi'}, (err, conn) => {
		if (err) throw err;
		r.table('userLocation').get()
	})
}

function stopRecording(lastLocation) {//shouldn't save
	console.log('Stopped recording on #' + lastLocation);
	save();
	// path = [];
}

function save() {//change this to update
	console.log('Saving................')
	r.connect({host: 'localhost', port: 28015, db: 'vedi'}, function(err, conn) {
		if(err) throw err;
		connection = conn;

		r.table('userLocation').run(conn, (err, cursor) => {
			if (err) throw err;
			cursor.toArray((err, result) => {
				if (err) throw err;
				// if (result.length > 0) {
				console.log('result ' + result[0])
				pathInsert(result.length);
				// }
			})
		})
	})
};

function pathInsert(pathNumber) {
	r.connect({db: 'vedi'}, (err, conn) => {
		if (err) throw err;

		r.table('userLocation').insert([
				{
					pathNumber: pathNumber,
					path: {  }
				}
			]).run(conn, (err, result) => {
				if (err) throw err;
				console.log('Created path ' + result.id);
			})
		})



		// path.forEach((node, index) => {
		// 	r.table('userLocation').insert([			
		// 			{
		// 				pathNumber: pathNumber,
		// 				path: {
		// 					node: {
		// 						nodeNumber: node[0].nodeNumber,
		// 						latitude: node[0].latitude,
		// 						longitude: node[0].longitude}
		// 				}
		// 			}
		// 		]).run(connection, function(err, result){
		// 			if (err) throw err;
		// 			console.log(JSON.stringify(result, null, 2));
		// 		})
		// })
	// })
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
