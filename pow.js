// {POW!}

(function() {
	pow = {}

	pow.log = function() {
		if (console.log && pow.log.enabled) {
			console.log.apply(console, arguments)
		}
	}
	pow.log.enabled = true

	pow.update = function() {
		pow.log('{POW!}')
		var powScript = document.getElementById('pow')
		if (!powScript.hasAttribute('data-loaded')) {
			// TODO: Replace this double request silliness with a string eval once we have a compilation system in place.
			try {
				var req = new XMLHttpRequest(),
					origin = powScript.src || powScript.getAttribute('data-origin')
				req.open('GET', origin, false)
				req.send()
			} catch (err) {
				pow.log('Failed to update pow.js from ' + origin + '. Continuing.')
				return
			}
			if (req.status == 200) {
				var innerScript = document.createElement('script')
				innerScript.id = 'pow'
				innerScript.setAttribute('data-origin', origin)
				innerScript.setAttribute('data-loaded', true)
				innerScript.innerHTML = req.responseText
				pow.log('Loaded updated pow.js from ' + origin + '. Restarting.')
				document.head.insertBefore(innerScript, powScript)
				document.head.removeChild(powScript)
				return true
			}
		} else {
			powScript.removeAttribute('data-loaded')
			pow.log('Detected restart. Continuing.')
		}
	}
	if (pow.update() == true) { return }

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
	pow.on.load = new pow.signal()  // After window.onload.
	pow.on.start = new pow.signal() // After loading completes.
	// pow.on.cleanup -- for cleaning the dom prior to saves?

	pow.Animation = function(duration, args) {
		this.on = {}
		this.on.frame = new pow.signal()
		this.on.finish = new pow.signal()
		if (args.frame) { this.on.frame(args.frame) }
		if (args.finish) { this.on.finish(args.finish) }
		this.duration = duration
		this.elapsed = 0
		this.step = 1000/60
	}
	pow.Animation.prototype = {
		get finished() {
			return this.duration && (!this.reversed ? this.elapsed == this.duration : this.elapsed == 0)
		},
		frame: function() {
			this.elapsed += this.step * (!this.reversed ? 1 : -1)
			this.elapsed = Math.min(Math.max(0, this.elapsed), this.duration)
			this.on.frame.fire(this.elapsed / this.duration)
			if (this.finished) {
				this.stop()
			}
		},
		start: function() {
			if (this.interval || this.finished) { return }
			this.on.frame.fire(this.elapsed)
			this.interval = setInterval(this.frame.bind(this), this.step)
		},
		stop: function() {
			if (this.interval) {
				clearInterval(this.interval)
				this.interval = null
				this.on.finish.fire()
			}
		},
		play: function(reset) {
			if (reset) { this.elapsed = 0 }
			this.reversed = false
			this.start()
		},
		reverse: function(reset) {
			if (reset) { this.elapsed = this.duration }
			this.reversed = true
			this.start()
		}
	}

	pow.style = {}
	pow.style.get = function(styleId) {
		var el = document.getElementById(styleId)
		if (!el) {
			el = document.createElement('style')
			el.id = styleId
			document.head.appendChild(el)
		}
		return el
	}
	pow.style.shadow = function(spec) {
		return ['', '-webkit-', '-moz-'].map(function(prefix) {
			return prefix+'box-shadow: '+spec
		}).join('; ')
	}
	pow.style.disableSelection = function() {
		return ['', '-webkit-', '-moz-'].map(function(prefix) {
			return prefix+'user-select:none'
		}).join('; ') + '; cursor:default'
	}

	pow.el = {}
	pow.el.replace = function(elId, parentEl) {
		var el = document.getElementById(elId)
		if (el) {
			el.innerHTML = ''
		} else {
			el = document.createElement('div')
			el.id = elId
			;(parentEl || document.body).appendChild(el)
		}
		return el
	}

	// Placeholder API during DOM load for scripting convenience.
	// This gets replaced with the current slide as soon as we have one.
	pow.slide = {}
	pow.slide.hide = function() {}
	pow.slide.on = {}
	pow.slide.on.show = function() {}

	pow.Slide = function(index, el) {
		this.index = index
		this.el = el
		this._setup()
	}
	pow.Slide.prototype = {
		_setup: function() {
			this.on = {}
			this.on.show = new pow.signal()
			this.on.hide = new pow.signal()

			var prevSlide = pow.slide
			pow.slide = this
			var scripts = this.el.getElementsByTagName('script')
			Array.prototype.forEach.call(scripts, function(script) {
				if (/^\s*pow\.slide\.on\.\w*\([\s\S]*\)\s*$/.test(script.innerHTML)) {
					eval(script.innerHTML)
				}
			})
			pow.slide = prevSlide
		},
		show: function() {
			pow.slide.hide()
			pow.slide = this
			this.on.show.fire()
			pow.slides.on.show.fire(this)
			this.el.classList.add('current')
		},
		hide: function() {
			this.el.classList.remove('current')
			this.on.hide.fire()
			pow.slides.on.hide.fire(this)
		},
		get next() {
			return (this.index < pow.slides.length - 1) && pow.slides[this.index + 1]
		},
		get prev() {
			return (this.index > 0) && pow.slides[this.index - 1]
		},
		animate: function(duration, args) {
			var anim = new pow.Animation(duration, args)
			this.on.hide.once(anim.stop.bind(anim))
			return anim
		}
	}

	pow.slides = []
	pow.slides.on = {}
	pow.slides.on.show = new pow.signal()
	pow.slides.on.hide = new pow.signal()
	pow.slides.load = pow.on.load(function() {
		var els = document.getElementsByClassName('slide')
		Array.prototype.forEach.call(els, function(el, index) {
			pow.slides.push(new pow.Slide(index, el))
		})
	})
	pow.slides.start = pow.on.start(function() {
		pow.slides[0].show()
	})

	pow.slides.go = {
		first: function() { pow.slides[0].show() },
		last: function() { pow.slides[pow.slides.length-1].show() },
		prev: function() {
			if (pow.slide.prev) {
				pow.slide.prev.show()
			}
		},
		next: function() {
			if (pow.slide.next) {
				pow.slide.next.show()
			}
		}
	}

	pow.slides.style = {}
	pow.slides.style.resize = function() {
		this.el = this.el || pow.style.get('pow-slide-scale-style')
		var width = Math.min(window.innerWidth, (4/3) * window.innerHeight) - 10,
			height = .75 * width - 10,
			padLeft = (window.innerWidth - width) / 2,
			padTop = (window.innerHeight - height) / 2,
			size = width / 800
		this.el.innerHTML =
			 '#slides {'
				+' left:'+padLeft+'px;'
				+' top:'+padTop+'px;'
				+' height:'+height.toFixed()+'px;'
				+' width:'+width.toFixed()+'px;'
				+' font-size:'+size.toFixed(4)+'px;'
			+' }\n'
	}
	pow.slides.style.load = pow.on.load(function() {
		pow.slides.el = document.getElementById('slides')
		pow.slides.el.addEventListener('click', pow.slides.go.next, false)
		window.addEventListener('click', function(e) {
			if (e.target == document.documentElement) { pow.slides.go.next() }
		})
		pow.slides.style.resize()
		window.addEventListener('resize', function() { pow.slides.style.resize() }, false)
	})

	window.addEventListener('load', function() {
		pow.on.load.fire()
		pow.on.start.fire()
	}, false)
})()
