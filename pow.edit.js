(function() {
	var style = pow.style.get('pow-edit')
	;['h1', 'h2', 'li'].forEach(function(name) {
		style.innerHTML +=
			'.slide[contenteditable=true] '+name+':hover { background: #eee; }'
	})

	pow.slides.on.show(function(slide) {
		slide.el.setAttribute('contenteditable', 'true')
	})

	pow.slides.on.hide(function(slide) {
		slide.el.removeAttribute('contenteditable')
	})

	window.addEventListener('click', function(e) {
		if (e.target.isContentEditable) {
			e.stopPropagation()
		}
	}, true)
})()
