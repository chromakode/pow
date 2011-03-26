pow.module('core', function() {
	pow.signal = function() {
		var handlers = []
		function register(handler) {
			handlers.push(handler)
			return handler
		}
		register.fire = function() {
			for (var i = 0; i < handlers.length; i++) {
				handlers[i].apply(null, arguments)
			}
		}
		register.remove = function(handler) {
			handlers.splice(handlers.indexOf(handler), 1)
		}
		register.once = function(handler) {
			register(function() {
				handler.apply(null, arguments)
				register.remove(handler)
			})
		}
		register.handlers = handlers
		return register
	}

	pow.on = {}
	pow.on.load = new pow.signal()  // After DOM loading completes
	pow.on.start = new pow.signal() // After pow has initialized.
	// pow.on.cleanup -- for cleaning the dom prior to saves?
	
	pow.params = {}
	pow.params.data = {}
	pow.params.slide = 0
	pow.params.get = function(key) {
		return key == 'slide' ? this.slide : this.data[key]
	}
	pow.params.set = function(key, value) {
		if (key == 'slide') {
			this.slide = value
		} else {
			this.data[key] = value
		}
		this.save()
	}
	pow.params.save = function() {
		params = []
		for (var key in this.data) {
			params.push(key+'='+this.data[key])
		}
		if (this.slide != 0) {
			params.push(this.slide)
		}
		window.location.hash = params.join(',')
	}
	pow.params.load = pow.on.load(function() {
		window.location.hash.substr(1).split(',').forEach(function(param) {
			param = param.split('=')
			if (param.length == 1) {
				pow.params.slide = param[0]
			} else {
				pow.params.data[param[0]] = param[1]
			}
		})
	})

	// TODO: add IE support here
	window.addEventListener('DOMContentLoaded', function() {
		pow.compat.advise()
		pow.on.load.fire()
		pow.on.start.fire()
	}, false)
})
