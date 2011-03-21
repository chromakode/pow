pow.module('live', function() {
	/*~socket.io.js~*/
	pow.live = {}
	pow.live.promptKey = function() {
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
					pow.live.socket.send({ name:'authorize', token:msg.token }) 
					dialog.close()
				}
			}
		}, false)
		dialog.show()
	}
	pow.live.start = function() {
		var socket = pow.live.socket = new io.Socket('localhost', {
			port: 1234,
			secure: true,
			resource: 'live',
			transports: ['xhr-polling', 'jsonp-polling'],
			rememberTransport: false
		})
		socket.on('connect', function() {
			pow.log('pow.live connected.')
			if (pow.live.role == 'present') {
				pow.live.promptKey()
			}
		})
		socket.on('message', function(msg) {
			pow.live.processing = true
			if (msg.name == 'authorized') {
				if (msg.success == true) {
					socket.send({ name:'slide', index:pow.slide.index })
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
		var origin = pow.params.get('live'),
			role = 'view'

		data = origin.split('@')
		if (data.length == 2) {
			role = data[0]
			origin = data[1]
		}
		
		if (origin) {
			pow.live.origin = 'https://'+origin
			pow.live.role = role
			pow.live.start()
		}
	})
})
