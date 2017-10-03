var r = require('rethinkdb');
var _ = require('lodash');

var express = require('express');
var router = express.Router();
var session = require('express-session');

// const io = require('socket.io')(8000);

// io.on('connection', function (socket) {
//   // socket.emit('node', { hello: 'world' });
//   socket.on('getUsers', (user) => {
// 		console.log('Socket open: ', user.name);
//     	getUsers(user);
//     });
// });


router.get('/getUsers', (req, res) => {

	res.send('OK');
})

module.exports = router;
