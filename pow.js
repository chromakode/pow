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
	pow.on.load = new pow.signal()
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
		frame: function() {
			this.on.frame.fire(this.elapsed / this.duration)
			this.elapsed += this.step
			if (this.duration && this.elapsed > this.duration) {
				this.stop()
			}
		},
		start: function() {
			var self = this
			this.on.frame.fire(0)
			this.interval = setInterval(function() { self.frame() }, this.step) 
		},
		stop: function() {
			if (this.interval) {
				this.on.frame.fire(1)
				clearInterval(this.interval)
				this.interval = null
				this.on.finish.fire()
			}
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

	// Placeholder API during DOM load for scripting convenience.
	// This gets replaced with the current slide as soon as we have one.
	pow.slide = {}
	pow.slide.hide = function() {}
	pow.slide.on = {}
	pow.slide.on.show = function() {}

	pow.Slide = function(index, el) {
		this.index = index
		this.el = el
		this._setup();
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
		get previous() {
			return (this.index > 0) && pow.slides[this.index - 1]
		},
		animate: function(duration, args) {
			var anim = new pow.Animation(duration, args)
			this.on.hide.once(anim.stop)
			return anim
		}
	}

	pow.slides = []
	pow.slides.load = pow.on.load(function() {
		var els = document.getElementsByClassName('slide')
		Array.prototype.forEach.call(els, function(el, index) {
			pow.slides.push(new pow.Slide(index, el))
		})
		pow.slides[0].show()
	})
	pow.slides.on = {}
	pow.slides.on.show = new pow.signal()
	pow.slides.on.hide = new pow.signal()
	pow.slides.style = {}
	pow.slides.style.resize = function() {
		this.el = this.el || pow.style.get('pow-slide-scale')
		var slides = document.getElementById('slides'),
			width = Math.min(slides.offsetWidth, (4/3) * slides.offsetHeight),
			height = .75 * width,
			padLeft = (slides.offsetWidth - width) / 2
			padTop = (slides.offsetHeight - height) / 2
			size = width / 800
		this.el.innerHTML =
			 '.slide {'
				+' height:'+height.toFixed()+'px;'
				+' width:'+width.toFixed()+'px;'
			+' }\n'
			+'#slides {'
				+' padding:'+padTop.toFixed()+'px '+padLeft.toFixed()+'px;'
				+' font-size:'+size.toFixed(4)+'px;'
			+' }\n'
	}
	pow.slides.style.load = pow.on.load(function() {
		pow.slides.style.resize()
		window.addEventListener('resize', function() { pow.slides.style.resize() }, false)
	})

	window.addEventListener('load', pow.on.load.fire, false)
	window.addEventListener('click', function(e) {
		if (pow.slide.next) { pow.slide.next.show() }
	}, false)
})()
