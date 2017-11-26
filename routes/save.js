var r = require('rethinkdb');
var _ = require('lodash');

var express = require('express');
var router = express.Router();
var tables = ['userLocation', 'user', 'messaging']

const WebSocket = require('ws')
const wss = new WebSocket.Server({ port: 8000 });
const wss2 = new WebSocket.Server({ port: 8888 });

var clientArr = {};
var clientArr2 = {};

wss2.on('connection', (socket2) => {
	console.log('8888 connected')
	// if client closes socket
	socket2.onclose = (event) => {
		let s = _.find(clientArr2, ['socket', socket2]);// find client's socket
		if (s) {
			clientArr2[s.id].close();// close from server side just to be sure
			delete clientArr[s.id];// delete socket
		}
	}

	socket2.onmessage = (event) => {
		let request = {};
		let data = JSON.parse(event.data);
		let messageSender = data.user.id;

		// if socket for this client does not exist...
		if (!_.find(clientArr2, ['socket', socket2])) {
			clientArr2[messageSender] = socket2; // ... add socket
		}
		switch (data.type) {

			case 'addNode' :
				save(data, (err, pathID) => {
					if (err) throw err;
					//send pathID
					request = {
						type: 'onAddNode',
						recipient: data.user.id,
						pathID: pathID,
					}
					console.log('save::', pathID)
					if (socket2) {emit(request, messageSender, clientArr2);}
				})
				break;

			case 'ping':
				var date = new Date();
				var time = date.getTime();
				pongTime = time - data.pingTime;
				request = {
					type: 'pong',
					pongTime: pongTime,
				}
				if (socket2) {emit(request, messageSender, clientArr2);}
				break;

			case 'userUpdate':
				console.log('firing userUpdate::', data.user);
				userUpsert(null, data.user, (err, response) => {
					if (err) throw err;
					request = {
						type: 'onUserUpdate',
						data: response,
					}
					console.log('userUpsert:: ', response);
					if (socket2) {emit(request, messageSender, clientArr2);}
				});
				break;

			default:
				console.log('Defaulted');
				break;

		}
	}
});

wss.on('connection', (socket) => {
	console.log('on connection::getUsers')
	getUsers((err, userList) => {
		if (err) throw err;
		response = {
			type: 'onGetUsers',
			userList: userList,
		};
		console.log('userList::', userList)
		socket.send(JSON.stringify(response));
	});

	socket.onclose = (event) => {
		// clientArr = _.omit(clientArr, ['socket', socket]);
		let s = _.find(clientArr, ['socket', socket]);
		if (s) {
			clientArr[s.id].close();
			delete clientArr[s.id];
		}
	}

	socket.onmessage = (event) => {
		let request = {};
		let data = JSON.parse(event.data);
		let messageSender = data.fromClient;
		
		if (!_.find(clientArr, ['socket', socket])) {
			clientArr[messageSender] = socket; 
		}

		switch (data.type) {
			case 'sendMessage':
				upsertMessage(data, (err, result) => {
					if (err) throw err;
					let eventName = 'messageReceived: ' + data.message.recipient;
					request = {
						type: 'onMessageReceived',
						sender: data.message.sender,
						recipient: data.message.recipient,
					};
					let recipient = data.users;
					console.log('Sending message to::', eventName)
					emit(request, recipient, clientArr);
				});
				break;

			case 'loadMessages':
				getMessages(data.users, (err, res) => {
					if (err) throw err;
					request = {
						type: 'onLoadMessages',
						messageBuffer: res,
						users: res.users,
					}
					// console.log('messageBuffer::', res)
					if (socket) {emit(request, messageSender, clientArr);}
				});
				break;

		}

	}
});

emit = (message, recipient, clientArr) => {
	if (!Array.isArray(recipient)) {
		recipient = [recipient];
	}
	if (typeof clientArr !== undefined && clientArr !== null) {
		// let sockObj = _.find(clientArr, ['id', r]);
		recipient.forEach((recipient) => {
			let socket = clientArr[recipient];
			if (typeof socket !== 'undefined') {
				socket.send(JSON.stringify(message));
				// console.log(socket)

			} else {
				console.log('Recipient undefined::', socket)
			}
		})
		/*if (typeof socket !== 'undefined' && socket.readyState == '1') {
			// Uncomment for testing emit();
			// console.log('sockObj.id::', sockObj.id)
			// console.log('message::', message.type)
			socket.send(JSON.stringify(message));
		} else {
			console.log('socket not ready :: ', socket)
		}*/
	}
}

upsertMessage = (message, callback) => { //upsert
	r.connect({db: 'vedi'}, (err, conn) => {
		if (err) callback(err);
		r.table('messaging').filter({
			users: message.users
		}).count().gt(0).run(conn, (err, result) => {
			if (err) callback(err);
			if (result) {
				r.table('messaging').filter((user) => {
					return user('users').eq(message.users);
				}).update({
					messages: r.row('messages').append(message.message)
				}).run(conn, (err, r) => {
					if (err) callback(err);
					console.log('append: ', r);
					callback(null, r);//what is r??
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
		// console.log('Saved message: ', message.message.messageBody)
	});
}

getMessages = (users, callback) => {
	r.connect({
		db: 'vedi'
	}, (err, conn) => {
		if (err) callback(err);
		r.table('messaging').count().gt(0).run(conn, (err, result) => {
			if (err) callback(err);
			if (result) {
				r.table('messaging').filter({
					users: users
				}).run(conn, (err, result) => { //select where users are sender and recipient
					if (err) callback(err);
					// console.log('Messages...', result);
					if (result) {
						result.toArray((err, r) => { //convert result to array with 1 value
							if (err) callback(err);
							if (r.length > 0) { //if array is not 0, a chat already exists
								if (typeof r[0] !== 'undefined') {
									// console.log('getMessages result 1:', r[0]);
									callback(null, r[0]); //sends back the message as an object, not an array
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

getUsers = (callback) => {
	r.connect({db: 'vedi'}, (err, conn) => {
		if (err) throw err;
		r.table('user').pluck('photo', 'name', 'id').run(conn, (err, cursor) => {
			if (err) callback(err);
			cursor.toArray((err, results) => {
				if (err) callback(err);
				callback(null, results);
			})
		})
	})
}

userLocationUpsert = (node, callback) => {
	r.connect({
		db: 'vedi'
	}, (err, conn) => {
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
				callback(null, node.pathID); //return the pathID that was just updated
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
				callback(null, r.generated_keys[0]); //returns the pathID that was just inserted
			})
				///////////////////////////////////////////////////////////////////////////////////}
		}
	})
}

userUpsert = (node, user, callback) => {
	console.log('node:: ', node);
	console.log('user:: ', user);
	// var user = user != null ? user : node.user;
	r.connect({db: 'vedi'}, (err, conn) => {
		if (err) throw err;
		if (node) {
			let lastLocation = {
				latitude: node.latitude,
				longitude: node.longitude,
				timestamp: node.timestamp,
			};
			console.log('userUpsert :: node exists')
			r.table('user').get(node.user.id).update({lastLocation: lastLocation}).default({}).run(conn, (err, res) => {
				if (err) callback(err)
				callback(null, res);
			});
		}
		if (user) {
			console.log('userUpsert :: user does not exist', user)
			r.table('user').insert({
				id: user.id,
				name: user.name,
				email: user.email,
				photo: user.photo,
			}, {conflict: 'update'}).run(conn, (err, res) => {
				if (err) callback(err);
				callback(null, res)
			})
		}
	})
}

/*userUpsert = (node, user, callback) => {
	r.connect({
		db: 'vedi'
	}, (err, conn) => {
		if (err) throw err;
		if (node) {
			r.table('user')('id').contains(node.user.id).run(conn, (err, res) => {
				if (err) callback(err);
				console.log(res);
				if (res == true) {
					console.log('Updating existing user');
					r.table('user').get(node.user.id).update({
						lastLocation: {
							latitude: node.latitude,
							longitude: node.longitude,
							timestamp: node.timestamp,
						}
					}).run(conn, (err, r) => {
						if (err) callback(err);
						callback(null, node.user.id);
					})
				} else {
					console.log('Inserting new user');
					r.table('user').insert({
						id: node.user.id,
						accessToken: node.user.accessToken,
						email: node.user.email,
						idToken: node.user.idToken,
						name: node.user.name,
						photo: node.user.photo,
						serverAuthCode: node.user.serverAuthCode,
						scopes: node.user.scopes,
						lastLocation: {
							latitude: node.latitude,
							longitude: node.longitude,
							timestamp: node.timestamp,
						}
					}).run(conn, (err, res) => {
						if (err) callback(err);
						callback(null, node.user.id);
					})
				}
			});
		}
		
		if (user) {
			r.table('user')('id').contains(user.id).run(conn, (err, res) => {
				if (err) callback(err);
				r.table('user').get(user.id).insert(user, {upsert: true}).run();
			})
		}

	})
}*/

save = (node, callback) => {
	userUpsert(node, null, (err, res) => {
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

/*dropTables = (tables) => {
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
}

createTables = (tables) => {
	console.log('Does not exist, creating...')
	tables.forEach((table) => {
		r.db('vedi').tableCreate(table).run(conn, (err, res) => {
				if (err) throw err;
				console.log(res);
		})
	})
}
*/

/*router.get('/drop', (req, res) => {
	r.connect({db: 'vedi'}, (err, conn) => {
		r.db('vedi').tableList().run(conn, (err, res) => {
			if (err) throw err;
			if (!_.find(res, tables)) {
				dropTables(tables);
			} else {
				createTables(tables);
			}
			})
		})
	res.send('ok')
})*/

module.exports = router;