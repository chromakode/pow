pow.module('slides', function() {
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

	// Placeholder API during DOM load for scripting convenience.
	// This gets replaced with the current slide as soon as we have one.
	pow.slide = {}
	pow.slide.hide = function() {}
	pow.slide.on = {}
	pow.slide.on.load = function() {}
	pow.slide.on.show = function() {}
	pow.slide.on.hide = function() {}

	pow.Slide = function(index, el) {
		this.index = index
		this.el = el
		pow.el.removeClass(this.el, 'current')
		this._setup()
	}
	pow.Slide.prototype = {
		_setup: function() {
			this.on = {}
			this.on.load = new pow.signal()
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
			
			this.on.load.fire(this)
			pow.slide = prevSlide
		},
		show: function() {
			if (pow.slide == this) { return; }
			pow.slide.hide()
			pow.slide = this
			pow.el.addClass(this.el, 'current')
			pow.slides.on.show.fire(this)
			this.on.show.fire(this)
		},
		hide: function() {
			pow.el.removeClass(this.el, 'current')
			this.on.hide.fire(this)
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
		pow.slides.el = document.getElementById('slides')
		window.addEventListener('click', function(e) {
			if (e.target == document.documentElement
					|| e.target == pow.slides.el
					|| e.target.parentNode == pow.slides.el)
				{ pow.slides.go.next() }
		}, false)

		var els = document.getElementsByClassName('slide')
		Array.prototype.forEach.call(els, function(el, index) {
			pow.slides.push(new pow.Slide(index, el))
		})
	})

	pow.slides.go = function(index) {
		index = Number(index) || 0
		if (index < 0) { index += pow.slides.length }
		var slide = pow.slides[index] || pow.slides[0]
		slide.show()
	}
	pow.slides.go.first = function() { pow.slides.go(0) }
	pow.slides.go.last = function() { pow.slides.go(-1) }
	pow.slides.go.prev = function() { if (pow.slide.prev) { pow.slide.prev.show() } }
	pow.slides.go.next = function() { if (pow.slide.next) { pow.slide.next.show() } }

	pow.slides.style = {}
	pow.slides.style.base = [
		'html { cursor:none; }',
		'body { margin:0; background:#111; }',
		'#slides { position:absolute; display:block; overflow:hidden; cursor:default; }',
		'.slide { background:#fff; border-radius:5px; }',
		'.slide { display:none; }',
		'.slide.current { display:table-cell; vertical-align:middle; }',
		'.slide h1, .slide h2 { text-align:center; margin:0; }',
		'.slide h1 { font-size:100em; }',
		'.slide h2 { font-size:48em; font-weight:normal; }',
		'.slide p, .slide > ul > li, .slide > ol > li { font-size:36em; }'
	].join('\n')
	pow.slides.style.scale = function() {
		this.el = this.el || pow.style.get('pow-slide-scale-style')
		var width = Math.min(window.innerWidth, (4/3) * window.innerHeight) - 10,
			height = .75 * width - 10,
			padLeft = (window.innerWidth - width) / 2,
			padTop = (window.innerHeight - height) / 2,
			size = width / 800
		this.el.innerHTML =
			 '#slides, .slide {'
				+' height:'+height.toFixed()+'px;'
				+' width:'+width.toFixed()+'px;'
			+'}\n'
			+'#slides {'
				+' left:'+padLeft+'px;'
				+' top:'+padTop+'px;'
				+' font-size:'+size.toFixed(4)+'px;'
			+' }\n'
	}
	pow.slides.style.load = pow.on.load(function() {
		pow.style.get('pow-slide-base-style').innerHTML = pow.slides.style.base
		pow.slides.style.scale()
		window.addEventListener('resize', function() { pow.slides.style.scale() }, false)
	})
	
	pow.url = {}
	pow.url.update = pow.slides.on.show(function() {
		pow.params.set('slide', pow.slide.index)
	})
	pow.url.read = pow.on.start(function() {
		pow.slides.go(pow.params.get('slide'))
	})
	window.addEventListener('hashchange', pow.url.read, false)
	
	window.addEventListener('mouseover', function() {
		window.focus()
	}, false)
})
