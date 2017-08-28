var r = require('rethinkdb');
var _ = require('lodash');
// const io = require('socket.io')();

var express = require('express');
var router = express.Router();
// var Location = require('location.js');
var connection;
var connStatus = false;
var currentID = null;
var x;
const io = require('socket.io')(8000);

io.on('connection', function (socket) {
  // socket.emit('node', { hello: 'world' });
  socket.on('addNode', function (node) {
    // console.log(node);
    save(node);
  });

  socket.on('beginPath', function (node) {
    console.log(node);
    beginPath(node);
  });

  socket.on('endPath', function (node) {
    console.log(node);
    endPath(node);
  });

});


// console.log(io.connected);

// io.on('connection', function (socket) {
//   socket.emit('news', { hello: 'world' });
//   socket.on('my other event', function (data) {
//     console.log(data);
//   });
// });

// const port = 8000;
// io.listen(port);
// console.log('Listening');

class Node {
	constructor(latitude, longitude, nodeNumber, timestamp) {
		this.latitude = latitude;
		this.longitude = longitude;
		this.nodeNumber = nodeNumber;
		this.timestamp = timestamp;
	}
}

var tables = ['userLocation', 'user']

router.get ('/drop', (req, res) => {
	r.connect({db: 'vedi'}, (err, conn) => {
		r.db('vedi').tableList().run(conn, (err, res) => {
			if (err) throw err;
			if (!_.find(res, tables)) {
				console.log('Exists. Dropping...');
				tables.forEach((table) => {
					r.db('vedi').tableDrop(table).run(conn, () => {
						console.log('Dropped \'' + table + '\', in Vedi');
						r.db('vedi').tableCreate(table).run(conn, (err, res) => {
							if (err) throw err;
							console.log(res);
						})
					})
				})
			} else {
				console.log('Does not exist, creating...')
				tables.forEach((table) => {
					r.db('vedi').tableCreate(table).run(conn, (err, res) => {
							if (err) throw err;
							console.log(res);
						})
					})
				}
			})
		})
		res.send('ok')
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

function checkUser(node) {
	r.connect({db: 'vedi'}, (err, conn) => {
		if (err) throw err;
		r.table('user')('id').contains(node.user.id).run(conn, (err, res) => {
			if (err) throw err;
			if (res == true) {
				console.log(res, 'User exists');
				r.table('user').get(node.user.id).update({
					lastLocation: {
						latitude: node.latitude,
						longitude: node.longitude,
						timestamp: node.timestamp,
					}
				}).run(conn, (err, res) => {
					if (err) throw err;
					console.log(res, 'Last known location updated');
				});
			} else {
				console.log('User does not exist', res);
				r.table('user').insert(node.user).run(conn, (err, r) => {
					if (err) throw err;
					console.log(r);
				})
			}
		})
	})
}

function save(node) {
	console.log('Saving #', node.nodeNumber)
	if (node.recording == true) {
		console.log('Adding node...');
		console.log('User table check');
		checkUser(node);
		r.connect({db: 'vedi'}, (err, conn) => {
			if (err) throw err;
			if(currentID == null) {
				r.table('userLocation').insert({
					user: node.user.id,
					path: [{
						nodeNumber: node.nodeNumber,
						latitude: node.latitude,
						longitude: node.longitude,
						timestamp: node.timestamp,
					}]
				}).run(conn, (err, cursor) => {
					if (err) throw err;
					console.log('Inserted initial')
					currentID = cursor.generated_keys[0];
				})
			} else {
				if (typeof currentID !== 'undefined' && currentID !== null) {
					console.log('currentID = ', currentID, 'Path exists, adding ', node.nodeNumber)
					r.table('userLocation').get(currentID).update({
						path: r.row("path").append({
							nodeNumber: node.nodeNumber,
							latitude: node.latitude,
							longitude: node.longitude,
							timestamp: node.timestamp,
						})
					}).run(conn, (err, res) => {
						if (err) throw err;

					})				
				} else { 
					console.log('currentID is null');
				}
			}
		});
	}
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
