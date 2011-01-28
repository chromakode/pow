// {POW!}

pow = {}

pow.log = function() {
	if (console.log && pow.log.enabled) {
		console.log.apply(console, arguments)
	}
}
pow.log.enabled = true

;(pow.loader = function() {
	pow.log('{POW!}')
	var powScript = document.getElementById('pow')
	if (!powScript.hasAttribute('loaded')) {
		// TODO: Replace this double request silliness with a string eval once we have a compilation system in place.
		try {
			var req = new XMLHttpRequest(),
				origin = powScript.src || powScript.getAttribute('origin')
			req.open('GET', origin, false)
			req.send()
			if (req.status == 200) {
				var innerScript = document.createElement('script')
				innerScript.id = 'pow'
				innerScript.setAttribute('data-origin', origin)
				innerScript.setAttribute('data-loaded', true)
				innerScript.innerHTML = req.responseText
				pow.log('Loaded updated pow.js from ' + origin + '. Restarting.')
				document.head.insertBefore(innerScript, powScript)
				document.head.removeChild(powScript)
				return
			}
		} catch (err) {}
		pow.log('Failed to update pow.js from ' + origin + '. Continuing.')
	} else {
		powScript.removeAttribute('loaded')
		pow.log('Detected restart. Continuing.')
	}
})()

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
	return register
}

pow.on = {}
pow.on.load = new pow.signal()
// pow.on.cleanup -- for cleaning the dom prior to saves?

pow.slides = []
pow.slides.show = function(slide) {
	slide = slide || pow.slides[0]
	if (pow.slides.current) {
		pow.slides.current.classList.remove('current')
	}
	slide.classList.add('current')
	pow.slides.current = slide
}
pow.slides.next = function() {
	pow.slides.show(pow.slides.current.nextElementSibling || pow.slides[0])
}
pow.slides.previous = function() {
	pow.slides.show(pow.slides.current.prevElementSibling || pow.slides[pow.slides.length])
}
pow.slides.load = pow.on.load(function() {
	Array.prototype.forEach.call(document.getElementsByClassName('slide'), function(slideEl) {
		pow.slides.push(slideEl)
	})
	pow.slides.show()
})

pow.slides.style = {}
pow.slides.style.resize = function() {
	if (!this.el) {
		this.el = document.createElement('style')
		this.el.id = 'pow-slide-style'
		document.head.appendChild(this.el)
	}
	var slides = document.getElementById('slides'),
		width = Math.min(slides.offsetWidth, (4/3) * slides.offsetHeight),
		height = .75 * width,
		padLeft = (slides.offsetWidth - width) / 2
		padTop = (slides.offsetHeight - height) / 2
		size = width / 800
	this.el.innerHTML =
		'.slide {'
			+ ' left:'+padLeft+'px;'
			+ ' top:'+padTop+'px;'
			+ ' height:'+height+'px;'
			+ ' width:'+width+'px;'
		+' }\n'
		+'#slides { font-size:'+size+'px; }'
}
pow.slides.style.load = pow.on.load(function() {
	pow.slides.style.resize()
	window.addEventListener('resize', function() { pow.slides.style.resize() }, false)
})

window.addEventListener('load', pow.on.load.fire, false)
window.addEventListener('click', function(e) {
	if (!e.target.isContentEditable) {
		pow.slides.next()
		e.preventDefault()
	}
}, false)
