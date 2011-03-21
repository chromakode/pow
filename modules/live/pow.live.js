pow.module('live', function() {
	/*~socket.io.js~*/
	pow.live = {}
	pow.live.login = function(cb) {
		if (pow.live.token) { cb(pow.live.token) }

		var dialog = new pow.ui.Dialog(),
			iframe = document.createElement('iframe')
		iframe.src = pow.live.origin + '/authorize'
		iframe.style.cssText = 'width:100%; height:100%; border:none;'
		dialog.el.appendChild(iframe)
		window.addEventListener('message', function(e) {
			if (e.origin == pow.live.origin) {
				var msg = JSON.parse(e.data)
				if (msg.name == 'authorized') {
					pow.live.token = msg.token
					dialog.close()
					window.removeEventListener('message', arguments.callee, false)
					cb(msg.token)
				}
			}
		}, false)
		dialog.show()
	}
	pow.live.start = function() {
		var origin = pow.live.origin.split(/:\/\/|:/),
			socket = pow.live.socket = new io.Socket(origin[1], {
				port: origin[2],
				secure: true,
				resource: 'live',
				transports: ['xhr-polling', 'jsonp-polling'],
				rememberTransport: false
			})
		socket.on('connect', function() {
			pow.log('pow.live connected.')
			if (pow.live.role == 'present') {
				pow.live.login(function(token) {
					pow.live.socket.send({ name:'authorize', token:token })
				})
			}
		})
		socket.on('message', function(msg) {
			pow.live.processing = true
			if (msg.name == 'authorized') {
				if (msg.success == true) {
					socket.send({ name:'slide', index:pow.slide.index })
				} else {
					delete pow.live.token
				}
			} if (msg.name == 'slide') {
				pow.slides.go(msg.index)
			}
			pow.live.processing = false
		})
		socket.on('disconnect', function(){})

		pow.slides.on.show(function(slide) {
			if (pow.live.role == 'present' && !pow.live.processing) {
				socket.send({ name:'slide', index:slide.index })
			}
		})
		
		socket.connect()
	}
	pow.live.load = pow.on.load(function() {
		var origin = pow.params.get('live')

		if (origin) {
			var role = 'view'
			data = origin.split('@')
			if (data.length == 2) {
				role = data[0]
				origin = data[1]
			}
			
			pow.live.origin = 'https://' + origin
			pow.live.role = role
			pow.live.start()
		}
	})
})
