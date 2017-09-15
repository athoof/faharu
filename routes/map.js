var r = require('rethinkdb');
var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var connection;
var _ = require('lodash');

/* GET home page. */
router.get('/', (req, res) => {
	getUserList(null, (err, userList) => {
		if (err) throw err;
		// console.log('UserList::: ', userList)
		res.render('map', { title: 'Map: Select a user.', paths: null, userList: userList, selectedUser: null });
	});
});

// router.get('/:user', (req, res) => {
// 	if (req.params.user) {
// 		getPaths(req.params.user, (err, r) => {
// 			if (err) throw err;
// 			res.json(r);
// 		})
// 	}
// })

router.get('/:user', (req, res) => {
	getUserList(null, (err, userList) => {
		if (err) throw err;
		if (typeof req.params.user !== 'undefined') {
			getPaths(req.params.user, (err, paths) => {
				if (err) throw err;
				// console.log('Userlist at :user', JSON.stringify(userList))
				// console.log('Listing paths for user: '+ req.params.user + ' ' + paths)
				let selectedUser = _.find(userList, { 'id' : req.params.user })
				res.render('map', {title: 'Map: Viewing paths for ' + selectedUser.name, paths: paths, userList: userList, selectedUser: selectedUser });
			});
		} else { 
			console.log('FAILED TO LOAD PATHS');
			res.render('map', { title: 'Map: Incorrect user. Select a user from list: ', paths: null, userList: userList, selectedUser: null });
		}
	})
}) 


function getPaths(user, callback) {
	r.connect({db: 'vedi'}, (err, conn) => {
		if (err) callback(err);
		r.table('userLocation').filter({user: user}).pluck('path', 'id').run(conn, (err, result) => {
			if (err) callback(err);
			let pathArr = []
			result.toArray((err, r) => {
				if (err) callback(err);
				// pathArr.push(r.path);
				callback(null, r)
			}) 
		})
	})
}

function getUserList(searchparam, callback) {
	// searchparam = req.body.searchparam;
	var userList = [];
	r.connect({db: 'vedi'}, (err, conn) => {
		if (err) throw err;
		r.table('user').pluck('id', 'name', 'lastLocation').run(conn, (err, result) => {
			if (err) throw err;
			result.toArray((err, result) => {
				if (err) throw err;
				callback(null, result)
			})

		})
	})
}



module.exports = router;
