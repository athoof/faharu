var r = require('rethinkdb');
var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var connection;
var _ = require('lodash');

router.get('/:user', (req, res) => {
	getUserList(null, (err, userList) => {
		if (err) throw err;
		if (typeof req.params.user !== 'undefined') {
			getPaths(req.params.user, (err, paths) => {
				if (err) throw err;
				console.log('Listing paths for user: '+ req.params.user + ' ' + paths)
				let selectedUser = _.find(userList, { 'id' : req.params.user })
				res.render('map', {title: 'Map: Viewing ' + selectedUser.name, paths: paths, userList: userList, selectedUser: selectedUser });
			});
		} else { console.log('FAILED TO LOAD PATHS') }
	})
}) 


/* GET home page. */
router.get('/', (req, res, next) => {
	getUserList(null, (err, userList) => {
		if (err) throw err;
		console.log('Select a user: ', userList)
		res.render('map', { title: 'Map: Select a user.', paths: null, userList: userList, selectedUser: null })
	});
/*	r.connect({db: 'vedi'}, (err, conn) => {
		if (err) throw err;
		r.table('user').run(conn, (err, result) => {
			if (err) throw err;
			if (result != null && typeof result != 'undefined') {
				console.log('Loading users and their last known locations');
				result.toArray((err, r) => {
					if (err) throw err;
					// console.log(r);
					res.render('map', {title: 'Map', users: r });
				})
			} else {
				console.log('No users');
  				res.render('map', { title: 'Map'});
			}
		});
	});*/
});

function getPaths(user, callback) {
	r.connect({db: 'vedi'}, (err, conn) => {
		if (err) callback(err);
		r.table('userLocation').run(conn, (err, result) => {
			if (err) callback(err);
			result.toArray((err, r) => {
				if (err) callback(err);
				// console.log('Pre filter', r);
				result = _.filter(r, {'user': user});//test if multiple users work
				// console.log('Post filter', r);
				callback(null, r)
			}) 
		})
	})
}

function getUserList(searchparam, callback) {
	// searchparam = req.body.searchparam;
	r.connect({db: 'vedi'}, (err, conn) => {
		if (err) callback(err);
		r.table('user').run(conn, (err, result) => {
			if (err) callback(err);
			var userList = []
			// console.log(result);
			result.each((err, user) => {
				// console.log(user);
				userList.push({name: user.name, id: user.id, lastLocation: user.lastLocation});
				if (typeof searchparam !== 'undefined' && searchparam !== null ) {
					userList = _.filter(userList, [searchparam]);
				}
				callback(null, userList);
			})
		})
	})
}



module.exports = router;
