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
					window.removeEventListener('message', arguments.callee, false)
					setTimeout(function() {
						dialog.close()
					}, 750)
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
			} else {
				pow.live.hud.show()
			}
		})
		socket.on('message', function(msg) {
			pow.live.processing = true
			if (msg.name == 'authorized') {
				if (msg.success == true) {
					pow.live.hud.show()
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
	pow.live.hud = {}
	pow.live.hud.fade = new pow.Animation(400, {
		frame: function(val) { pow.live.hud.el.style.opacity = .75 * val }
	})
	pow.live.hud.show = function() {
		if (!this.el) {
			this.el = pow.el.replace('pow-live-hud', document.getElementById('slides'))
			pow.style.get('pow-live-style').innerHTML = '#pow-live-hud { border:.25em solid red; color:red; padding:0 .15em; font-family:sans-serif; font-size:30em; font-weight:bold; letter-spacing:-.05em; border-radius:.25em; position:absolute; right:1em; bottom:1em; }'
			this.el.textContent = 'LIVE'
		}
		this.fade.play()
		this.fade.on.finish.once(function() {
			setTimeout(function() {
				pow.live.hud.hide()
			}, 2000)
		})
	}
	pow.live.hud.hide = function() {
		if (this.el) {
			this.fade.reverse()
		}
	}
	pow.live.load = pow.on.start(function() {
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

			// FIXME: HACK: Wait until the window has finished loading to
			// prevent an infinite loading indicator.
			window.addEventListener('load', function() {
				setTimeout(function() {
					pow.live.start()
				}, 0)
			}, false)
		}
	})
})
