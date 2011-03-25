pow.module('canvg', function() {
	/*~rgbcolor.js~*/
	/*~canvg.js~*/
	function toArray(o) {
		return Array.prototype.slice.call(o)
	}

	function replaceSVG(svgTag) {
		var c = document.createElement('canvas')
		c.setAttribute('class', svgTag.getAttribute('class'))
		svgTag.parentNode.insertBefore(c, svgTag)
		svgTag.parentNode.removeChild(svgTag)
		c.width = c.clientWidth
		c.height = c.clientHeight

		// Work around automatic lowercasing of the viewbox attribute in some parsers.
		if (svgTag.hasAttribute('viewbox')) {
			svgTag.setAttributeNS('', 'viewBox', svgTag.getAttribute('viewBox'))
		}

		options = {ignoreMouse:true, ignoreDimensions:true}
		if (svgTag.nodeName == 'OBJECT') {
			canvg(c, svgTag.data, options)
		} else {
			var div = document.createElement('div')
			div.appendChild(svgTag)
			canvg(c, div.innerHTML, options)
		}
	}

	function canvgChildren(el) {
		if (el.nodeName == '#text') { return }
		var svgTags = [].concat(
				toArray(el.getElementsByTagName('svg')),
				toArray(el.getElementsByTagName('object')))
		svgTags.forEach(replaceSVG)
	}

	if (!pow.compat.inlineSVG) {
		pow.slides.on.show(function(slide) {
			canvgChildren(slide.el)
		}, false)

		pow.on.start(function() {
			toArray(document.body.childNodes).forEach(function(el) {
				if (el.id != 'slides') { canvgChildren(el) }
			})
		})
	}
})
