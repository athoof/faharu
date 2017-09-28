var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Vidhaafaiy', sub: 'Coming soon' });
});

router.get ('/nudes', (req, res) => {
	res.render('nudes');
})
module.exports = router;
