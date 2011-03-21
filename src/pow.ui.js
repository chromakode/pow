pow.module('ui', function() {
	pow.style = {}
	pow.style.get = function(styleId) {
		var el = document.getElementById(styleId)
		if (!el) {
			el = document.createElement('style')
			el.id = styleId
			document.head.insertBefore(el, document.getElementsByTagName('style')[0])
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
	pow.el.addClass = function(el, className) {
		if (el.classList) {
			el.classList.add(className)
		} else {
			if (!~el.className.split(' ').indexOf(className)) {
				el.className += ' ' + className
			}
		}
	}
	pow.el.removeClass = function(el, className) {
		if (el.classList) {
			el.classList.remove(className)
		} else {
			var classes = el.className.split(' '),
				index = classes.indexOf(className)
			if (~index) {
				classes.splice(index, 1)
			}
			el.className = classes.join(' ')
		}
	}

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

	pow.ui = {}
	pow.ui.mask = {}
	pow.ui.mask.show = function() {
		if (this.el) { return; }
		this.el = document.createElement('div')
		this.el.id = 'pow-mask'
		this.bg = document.createElement('div')
		this.bg.id = 'pow-mask-bg'
		this.el.appendChild(this.bg)
		document.body.appendChild(this.el)
	}
	pow.ui.mask.hide = function(cb) {
		if (!this.el) { return; }
		var self = this
		new pow.Animation(100, {
			frame: function(val) {
				self.el.style.opacity = val
			},
			finish: function() {
				cb()
				self.el.parentNode.removeChild(self.el)
				self.el = null
			}
		}).reverse(true)
	}
	pow.ui.mask.style = [
		'#pow-mask, .pow-dialog { cursor:default; }',
		'#pow-mask, #pow-mask-bg { position:absolute; top:0; left:0; bottom:0; right:0; z-index:998; }',
		'#pow-mask-bg { background:black; opacity:.5; }',
		'.pow-dialog { position:absolute; top:50%; height:22em; margin-top:-11.75em; left:50%; width:36em; margin-left:-18.75em; background:#111; border:.75em solid #ccc; font-family:sans-serif; color:white; z-index:999; }',
		'.pow-dialog h1, h2 { margin:1em; }',
		'.pow-dialog h1 { font-size:1.7em; }',
		'.pow-dialog h2 { font-size:1.5em; color:#aaa; }',
		'.pow-dialog a { color:white; }',
		'.pow-dialog p { text-align:center; margin-top:3em; }',
		'.pow-dialog button { font-size:20px; }'
	].join('\n')
	pow.ui.mask.load = pow.on.load(function() {
		pow.style.get('pow-mask-style').innerHTML = pow.ui.mask.style
	})
	
	pow.ui.Dialog = function() {
		this.el = document.createElement('div')
		this.el.className = 'pow-dialog'
	}
	pow.ui.Dialog.prototype = {
		show: function() {
			if (this.isShowing) { return }
			this.isShowing = true
			pow.ui.mask.show()
			pow.ui.mask.el.appendChild(this.el)
		},
		close: function() {
			if (!this.isShowing) { return }
			var self = this
			pow.ui.mask.hide(function() {
				this.isShowing = false
				self.el.parentNode.removeChild(self.el)
			})
		}
	}
})
