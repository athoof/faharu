var r = require('rethinkdb');
var _ = require('lodash');

var express = require('express');
var router = express.Router();
var tables = ['userLocation', 'user']

const io = require('socket.io')(8000);
io.on('connection', (socket) => {
  socket.on('addNode', (node, callback) => {
    console.log('Socket open: ', node.timestamp);
    save(node, (err, pathID) => {
    	if (err) throw err;
    	callback(pathID);
    });
  });

  socket.on('getUsers', (u, callback) => {
	getUsers(u, (err, userList) => {
		if (err) throw err;
		callback({userList: userList});
	});
  })

  socket.on('sendMessage', (data, callback) => {
    console.log('Message received, saving: ', JSON.stringify(data));
    upsertMessage(data, (err, result) => {
    	if (err) throw err;
    	console.log('upsertMessage result: ', result);
    	callback(true)
    });
  });

  socket.on('loadMessages', (data, callback) => {
  	console.log('users[]', data.users)
  	getMessages(data.users, (err, res) => {
  		if (err) throw err;
  		callback(null, res);
  	});
  })

});

upsertMessage = (message, callback) => {//upsert
	r.connect({db: 'vedi'}, (err, conn) => {
		if (err) callback(err);
		r.table('messaging').filter({users: message.users}).count().gt(0).run(conn, (err, result) => {
			if (err) callback(err);
			if (result) {
				r.table('messaging').filter((user) => {
					return user('users').eq(message.users);
				}).update({
					messages: r.row('messages').append(message.message)
				}).run(conn, (err, r) => {
					if (err) callback(err);
					console.log('append: ', r);
					callback(null, r);
				});				
			} else {
				r.table('messaging').insert({
					users: message.users,
					messages: [message.message],
				}).run(conn, (err, r) => {
					if (err) callback(err);
					console.log('insert:', message.message.messageBody);
					callback(null, message.message.messageBody);
				})
			}	
		})
		console.log('Saved message: ', message.message.messageBody)
	});
}

getMessages = (users, callback) => {
	r.connect({db: 'vedi'}, (err, conn) => {
		if (err) callback(err);
		r.table('messaging').count().gt(0).run(conn, (err, result) => {
			if (err) callback (err);
			if (result) {
				r.table('messaging').filter({users: users}).run(conn, (err, result) => {//select where users are sender and recipient
					if (err) callback(err);
					// console.log('Messages...', result);
					if (result) {
						result.toArray((err, r) => {//convert result to array with 1 value
							if (err) callback(err);
							if (r.length > 0) {//if array is not 0, a chat already exists
								if (typeof r[0] !== 'undefined') {
									console.log('getMessages result 1:', r[0]);
									callback(null, r[0]);//sends back the message as an object, not an array
								} else {
									callback('r[0] undefined')
								}
								
							}
						});
					} else {
						console.log('getMessages result 2: ', result);
						callback(result)
					}
				})
			} else {
				console.log('No records')
				callback(result);
			}
		})
	})
}

getUsers = (currentUser, callback) => {
	r.connect({db: 'vedi'}, (err, conn) => {
		if (err) throw err;
		r.table('user').pluck('photo','name','id').run(conn, (err, cursor) => {
			if (err) callback(err);
			cursor.toArray((err, results) => {
				if (err) callback (err);
				callback(null, results);
			})
		})
	})
}

userLocationUpsert = (node, callback) => {
	r.connect({db: 'vedi'}, (err, conn) => {
		if (err) callback(err);
		if (typeof node.pathID !== 'undefined' && node.pathID !== null && node.nodeNumber !== 0) {
			//if not nodeNumber #0, path exists, therefore append...
			//append{///////////////////////////////////////////////////////////////////////////
			console.log('pathID', node.pathID)
			r.table('userLocation').get(node.pathID).update({
				path: r.row("path").append({
					nodeNumber: node.nodeNumber,
					latitude: node.latitude,
					longitude: node.longitude,
					timestamp: node.timestamp,
				})
			}).run(conn, (err, r) => {
				if (err) callback(err);
				callback( null, node.pathID);//return the pathID that was just updated
			})
		callback(null, node.pathID);
		} else {
			//if nodeNumber is 0, or path has not been created, insert...
			//insert{///////////////////////////////////////////////////////////////////////////
			r.table('userLocation').insert({
				user: node.user.id,
				path: [{
					nodeNumber: node.nodeNumber,
					latitude: node.latitude,
					longitude: node.longitude,
					timestamp: node.timestamp,
				}]
			}).run(conn, (err, r) => {
				if (err) callback(err);
				callback(null, r.generated_keys[0]);//returns the pathID that was just inserted
			})
			///////////////////////////////////////////////////////////////////////////////////}
		}
	})
}

userUpsert = (node, callback) => {
	r.connect({db: 'vedi'}, (err, conn) => {
		if (err) throw err;
		r.table('user')('id').contains(node.user.id).run(conn, (err, res) => {
			if (err) callback(err);
			console.log(res);
			if (res == true) {
				console.log('Updating existing user');
				r.table('user').get(node.user.id).update({
					lastLocation : {
						latitude : node.latitude,
						longitude : node.longitude,
						timestamp : node.timestamp,
					}
				}).run(conn, (err, r) => {
					if (err) callback(err);
					callback(null, node.user.id);
				})
			} else {
				console.log('Inserting new user');
				r.table('user').insert({	
					id : node.user.id,
					accessToken : node.user.accessToken,
					email : node.user.email,
					idToken : node.user.idToken,
					name : node.user.name,
					photo : node.user.photo,
					serverAuthCode : node.user.serverAuthCode,
					scopes : node.user.scopes,
					lastLocation : {
						latitude : node.latitude,
						longitude : node.longitude,
						timestamp : node.timestamp,
					}
				}).run(conn, (err, res) => {
					if (err) callback(err);
					callback(null, node.user.id);
				})
			}
		});
	})
}

save = function (node, callback) {
	userUpsert(node, (err, res) => {
		if (err) console.log(err);
		console.log('User: ', node.user.id);
	})
	console.log('Inserting/Appending path');
	userLocationUpsert(node, (err, res) => {
		if (err) throw err;
		callback(null, res)
		console.log('Node added to path: ', res)
	})
}

module.exports = router, save, io;
