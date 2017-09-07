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

function save(node) {
	console.log('Saving #', node.nodeNumber)
	console.log('Adding node')
	r.connect({db: 'vedi'}, (err, conn) => {
		if (err) throw err;
		if (currentID != null) {
			r.table('user')('id').contains(currentID.userid).run(conn, (err, res) => {
				if (err) throw err;
				if (res) {
					r.do(
						r.table('user').get(node.user.id).update({
							lastLocation: {
								latitude: node.latitude,
								longitude: node.longitude,
								timestamp: node.timestamp,
							}
						}),

						r.table('userLocation').get(currentID.id).update((path)=>{
							return path.append({//need to replace r.row
								nodeNumber: node.nodeNumber,
								latitude: node.latitude,
								longitude: node.longitude,
								timestamp: node.timestamp,
							})
						})
					).run(conn, (err, r) => {
						if (err) throw err;
						console.log('Appended ', currentID.id, ' lastLocation updated for ', currentID.userid);
					})
				}
			})
		} else {
			r.table('user')('id').contains(node.user.id).run(conn, (err, res) => {
				if (err) throw err;
				if (res) {
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
						currentID = {"id" : cursor.generated_keys[0], "userid" : node.user.id}
						console.log('Inserted initial: ', currentID.id)
					})
				} else {
					r.do(
							r.table('user').insert({	
								id : node.user.id,
								accessToken : node.user.accessToken,
								email : node.user.email,
								idToken : node.user.idToken,
								name : node.user.name,
								photo : node.user.photo,
								serverAuthCode : node.user.serverAuthCode,
								scopes : node.user.scopes,
								lastLocation: {
									latitude: node.latitude,
									longitude: node.longitude,
									timestamp: node.timestamp,
								}
							}),
							r.table('userLocation').insert({
								user: node.user.id,
								path : {
									nodeNumber: node.nodeNumber,
									latitude: node.latitude,
									longitude: node.longitude,
									timestamp: node.timestamp,
								}
							})
						).run(conn, (err, r) => {
							if (err) throw err;
							currentID = {"id" : r.generated_keys[0], "userid" : node.user.id}
							console.log('Inserted new path and updated last known location for ', currentID.userid)

						})
				}
			})
		}
	})
}

module.exports = router;
