pow.module('compat', function() {
	pow.compat = {}
	pow.compat.good = true
	pow.compat.check = function() {
		if (!document.head) {
			document.head = document.getElementsByTagName('head')[0]
			pow.compat.good = false
		}
		
		// From https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
		if (!Function.prototype.bind) {
			Function.prototype.bind = function(obj) {
				var slice = [].slice,
					args = slice.call(arguments, 1),
					self = this,
					nop = function () {},
					bound = function () {
					  return self.apply(this instanceof nop ? this : ( obj || {} ),
										  args.concat(slice.call(arguments)))
					}

				nop.prototype = self.prototype
				bound.prototype = new nop()
				return bound
			}
			pow.compat.good = false
		}

		// From Modernizr (http://www.modernizr.com/)
		var div = document.createElement('div')
		div.innerHTML = '<svg/>'
		pow.compat.inlineSVG = (div.firstChild && div.firstChild.namespaceURI) == 'http://www.w3.org/2000/svg'
		if (!pow.compat.inlineSVG) {
			pow.compat.good = false
		}
	}
	pow.compat.check()

	pow.compat.advise = function() {
		if (pow.compat.good) { return }

		if (window.localStorage) {
			if (window.localStorage.compatWarned) {
				return
			} else {
				window.localStorage.compatWarned = true
			}
		}

		var warning = new pow.ui.Dialog()
		warning.el.style.borderColor = "#cc0"
		warning.el.innerHTML = [
			'<h1><strong style="color:yellow">Warning:</strong> These slides require HTML5 features your browser does not support.</h1>',
			'<h2 style="font-weight:normal">Some things may not work properly in your current browser. For best goods, try the latest version of <a href="http://www.google.com/chrome">Chrome</a> or <a href="http://firefox.com">Firefox 4</a>.</h2>',
			'<p><button>Ok, view the slides.</button></p>'
		].join('\n')
		warning.el.getElementsByTagName('button')[0].onclick = function() {
			warning.close()
		}
		warning.show()
	}
})


