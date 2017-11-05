var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  // res.render('index', { title: 'Faharu' });
  res.send(arrayShit())
});

var arr = [0, 1, 2, 3, 4];

arrayShit = () => {
	var x, a, y;
	for (var i = 0; i < arr.length / 2; i++) {
		x = arr[i]
		a = arr.length - i;
		y = arr[arr.length - 1 - i]
		console.log(i, a);
		arr[i] = y;
		arr[arr.length - i] = x;
	}
	return arr;
}

module.exports = router;
