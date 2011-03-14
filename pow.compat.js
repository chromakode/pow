pow.module('compat', function() {
	var warn = false

	if (!document.head) {
		document.head = document.getElementsByTagName('head')[0]
		warn = true
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
		warn = true
	}

	// From Modernizr (http://www.modernizr.com/)
	var div = document.createElement('div')
	div.innerHTML = '<svg/>'
	var supportsInlineSVG = (div.firstChild && div.firstChild.namespaceURI) == 'http://www.w3.org/2000/svg'
	if (!supportsInlineSVG) {
		warn = true
	}

	function showWarning() {
		if (warn) {
			var warning = document.createElement('div')
			warning.innerHTML = [
				'<style>',
				'	.pow-mask, .pow-warning { cursor:default; }',
				'	.pow-mask { position:absolute; top:0; left:0; bottom:0; right:0; background:black; opacity:.5; }',
				'	.pow-warning { position:absolute; top:50%; height:22em; margin-top:-11em; left:50%; width:36em; margin-left:-18em; background:#111; border:10px solid #cc0; font-family:sans-serif; color:white; overflow:auto; z-index:999; }',
				'	.pow-warning h1, h2 { margin:1em; }',
				'	.pow-warning h1 { font-size:1.7em; }',
				'	.pow-warning h2 { font-size:1.5em; color:#aaa; }',
				'	.pow-warning a { color:white; }',
				'	.pow-warning p { text-align:center; margin-top:3em; }',
				'	.pow-warning button { font-size:20px; }',
				'</style>',
				'<div class="pow-mask"></div>',
				'<div class="pow-warning">',
				'	<h1><strong style="color:yellow">Warning:</strong> These slides require HTML5 features your browser does not support.</h1>',
				'	<h2 style="font-weight:normal">Some things may not work properly in your current browser. For best results, try the latest version of <a href="http://www.google.com/chrome">Chrome</a> or <a href="http://firefox.com">Firefox 4</a>.</h2>',
				'	<p><button>Ok, view the slides.</button></p>',
				'</div>'
			].join('\n')
			warning.getElementsByTagName('div')[0].onclick = warning.getElementsByTagName('button')[0].onclick = function() {
				warning.parentNode.removeChild(warning)
			}
			document.body.appendChild(warning)
		}
	}
	
	if (window.attachEvent) {
		window.attachEvent('load', showWarning)
	} else {
		window.addEventListener('DOMContentLoaded', showWarning, false)
	}
})


