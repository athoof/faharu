var r = require('rethinkdb');
var _ = require('lodash');

var express = require('express');
var router = express.Router();
var session = require('express-session');

router.get('/', (req, res) => {
	res.send('OK');
})

module.exports = router;
