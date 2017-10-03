var r = require('rethinkdb');
var _ = require('lodash');

var express = require('express');
var router = express.Router();

// const io = require('socket.io')(8000);
// var saveNode = require('./save')

/*io.on('connection', (socket) => {
	// socket.emit('node', { hello: 'world' });
	console.log('Connected');
	socket.on('addNode', (node) => {
		console.log('Socket open: ', node.timestamp);
		saveNode(node);
	});

	socket.on('getUsers', (user) => {
		console.log('Socket open: ', user.name);
			getUsers(user);
		});
});
*/
router.get('/', (req, res) => {
	res.render('index');
})

module.exports = router;