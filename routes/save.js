var r = require('rethinkdb');
var _ = require('lodash');

var express = require('express');
var router = express.Router();
var session = require('express-session');
var tables = ['userLocation', 'user']

const io = require('socket.io')(8000);
/*var session = {
	secret: 'faharu',
	cookie: {}
}
router.use(session(session));*/

var currentID = null;
session.currentID = null;
console.log(session.currentID);

io.on('connection', (socket) => {
  // socket.emit('node', { hello: 'world' });
  socket.on('addNode', (node) => {
    console.log('Socket open: ', node.timestamp);
    save(node);
  });

  socket.on('getUsers', (user) => {
    console.log(user);
    getUsers(user, (err, userList) => {
    	socket.emit('receiveUsers', {userList});
    });
  });

  socket.on('getMessages', (selectedRecipient) => {
    console.log(selectedRecipient);
    getMessages(selectedRecipient, (err, messageBuffer) => {
    	socket.emit('messageBuffer', {messageBuffer});
    });
  });

  socket.on('sendMessage', (messageObj) => {
    console.log('Message received, saving: ', messageObj.message);
    upsertMessage(messageObj, (err, result) => {
    	if (err) throw err;
    	console.log('upsertMessage result: ', result);
    });
    // getMessages(messageObj.users, (err, messageBuffer) => {
    // 	socket.emit('messageBuffer', {messageBuffer});
    // })
  });

});

upsertMessage = (messageObj, callback) => {//upsert
	r.connect({db: 'vedi'}, (err, conn) => {
		if (err) callback(err);
		// getMessages(messageObj.users, (err, messageID) => {
		// if (err) callback(err);
		r.table('messaging').filter({'users': messageObj.users}).pluck('id').run(conn, (err, result) => {
			if (err) callback (err);
			if (typeof result !== 'undefined' && result !== null && result > 0) {
				r.table('messaging').get(result).update({
					messages: r.row('messages').append({
						sender : messageObj.sender,
						recipient : messageObj.recipient,
						messageBody : messageObj.message,
						timestamp : messageObj.timestamp,
					}).run(conn, (err, r) => {
						if (err) callback(err);
						console.log('append: ', r);
						callback(null, r);
					})
				});
			} else {
				r.table('messaging').insert(messageObj).run(conn, (err, r) => {
					if (err) callback(err);
					console.log('insert:', r);
					callback(null, r);
				})
				// callback(result);
			}
		})
		// if ( typeof messageID !== 'undefined' && messageID !== null ) {//update/append
			// r.table('messaging').run(conn, (err, result) => {
				// if (err) callback(err);
				
			// });
		// } else {//insert
			// console.log('messageID: ', messageID);
			
		// }
		console.log('Saved message: ', messageObj.message)
		// });
	});
}

getMessages = (users, callback) => {
	r.connect({db: 'vedi'}, (err, conn) => {
		if (err) callback(err);
		r.table('messaging').count().gt(0).run(conn, (err, result) => {
			if (err) callback (err);
			if (result) {
				r.table('messaging').filter({users: users}).run(conn, (err, result) => {
					if (err) callback(err);
					// console.log('Messages...', result);
					if (result) {
						console.log(result.id);
						callback(null, result.id);
					} else {
						console.log(result);
						callback('Result is empty', null)
					}
					// result.toArray((err, results) => {
					// 	if (err) callback(err);
					// 	callback(null, results);
					// })
				})
			} else {
				callback('No records exist');
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
				// console.log('Results:', results);
				var result = [];
				results.forEach((user) => {
					result.push(user);
				})
				callback(null, results);
			})
		})
	})
}

/*router.get ('/drop', (req, res) => {
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
	})*/

userLocationUpsert = (node, callback) => {
	r.connect({db: 'vedi'}, (err, conn) => {
		if (err) callback(err);
		if (node.nodeNumber > 0 && typeof session.pathID !== 'undefined') {
			//if not nodeNumber #0, path exists, therefore append...
			//append{///////////////////////////////////////////////////////////////////////////
			r.table('userLocation').get(session.pathID).update({
				path: r.row("path").append({
					nodeNumber: node.nodeNumber,
					latitude: node.latitude,
					longitude: node.longitude,
					timestamp: node.timestamp,
				})
			}).run(conn, (err, r) => {
				if (err) callback(err);
				callback( null, session.pathID);//return the pathID that was just updated
			})
		callback(null, session.pathID);
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

save = function (node) {
	session.user = node.user.id;
	userUpsert(node, (err, res) => {
		if (err) console.log(err);
		session.user = res;
		console.log('User: ', session.user, '|| ', node.user.id);
	})
	console.log('Inserting/Appending path');
	userLocationUpsert(node, (err, res) => {
		if (err) throw err;
		session.pathID = res;
		console.log('Node added to path: ', session.pathID)
	})
}

module.exports = router, save, io;
