function addListeners() {
	var userList = []
	// var userList = document.querySelectorAll('a.user')
	// $('a.user').find('.user').each(function(){
	// 	userList.push(this.id)
	// });
	$("a.user").each(() => {
		$(this).bind("click", () => {
				var url = $(this).attr('id');
				console.log (url);
			})
	})

	userList = $("a.user")
		.map(function() { return this.id })
		.get()

	console.log('users', userList);
	if (userList.length > 0) {
		// userList = JSON.stringify(userList)
		console.log(userList)
		userList.forEach( (user) => {
			$(("click", () => {
				getPaths(user, (err, paths) => {
					generatePolyline(user, (err, polyArr) => {
						if (err) throw err;
						polyArr.forEach((polyLine) => {
							console.log('Added polyline')
							polyLine.setMap(map)
						})
						// console.log('Added ', polyArr);
					});
				})
			}))
		})
	}
}

// function getUser()

function getPaths(user, callback) {
	$.get('http://faharu.com/map/' + user, (paths) => {
		if (typeof paths !== 'undefined') {
			callback(null, JSON.stringify(paths));
		} else {
			callback(err);
		}
	})
	// $.ajax({
	// 	url: "http://faharu.com/map/" + user,
	// 	success: (result) => {
	// 		$("h1").html(result);
	// 		console.log(result);
	// 		callback(null, result);
	// 	}
	// })
}

function generatePolyline(user, callback) {
	if (user) {
		getPaths(user, (err, res) => {
			if (err) throw err;
			path.forEach((user) => {
				let polyArr = []
				$('a.user').bind('click', () => {
					var dPoly = Object.create(google.maps.Polyline);
					dPoly.setOptions({
						strokeColor: col,
						strokeOpacity: 0.8,
					 	strokeWeight: 6						
					})

					dPoly.user = user;

					polyArr.push(dPoly);
				})

				google.maps.event.addListener(dPoly, "mouseover", () => {
					console.log('Hovering over dPolyline');
					dPoly.setOptions({
						strokeOpacity: 1
					})
					console.log(dPoly.getPath().getArray().toString());
				})

				google.maps.event.addListener(dPoly, "mouseout", () => {
					console.log('Mouseout of dPolyline');
					dPoly.setOptions({
						strokeOpacity: 0.8
					})
				})

			})
			callback(null, polyArr);	
		})
	} else {
		var err = new Error('No user found');
		callback(err);
	}

}



function initMap() {
	var maldives = {lat: 4.178044, lng: 73.505828};
	var center = maldives;
	// if (selectedUser !== null) {
	// 	console.log('selectedUser: ', selectedUser)
	// 	var selectedUser = JSON.stringify(selectedUser).replace(/<\//g, '<\\/');
	// 		center = (selectedUser) ? {lat: selectedUser.lastLocation.latitude, lng: selectedUser.lastLocation.longitude} : center
	// 	}
	
	addListeners();
	//- var markerArray = [];
	console.log('Centered on: ', center)
	
	var map = new google.maps.Map(document.getElementById('map'), {
		zoom: 13,
		center: center
	});

	// var userList = JSON.stringify(userList).replace(/<\//g, '<\\/');
	// var paths = JSON.stringify(paths).replace(/<\//g, '<\\/');
	
			

	// if(paths !== null){
	// 	getUser((userList) => {
	// 		generatePolyline(userList);
	// 	})

	// 	paths.forEach((pathObj) => {
	// 	generatePolyline();
	// 	})
	// } else { console.log('No paths') }
	// userList.forEach((user) => {
	// 	var latLng = new google.maps.LatLng(user.lastLocation.latitude, user.lastLocation.longitude);
	// 	var marker = new google.maps.Marker({
	// 		position: latLng,
	// 		map: map
	// 	});
	// });
}