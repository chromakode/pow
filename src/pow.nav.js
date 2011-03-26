pow.module('nav', function() {
	var icon = {
		first: '<path fill="white" d="M 15,30 15,55 10,55 10,5 15,5 15,30, 45,0, 45,60 z"></path>',
		prev: '<path fill="white" d="M 15,30, 45,0, 45,60 z"></path>',
		next: '<path fill="white" d="M 45,30, 15,0, 15,60 z"></path>',
		last: '<path fill="white" d="M 45,30 45,55 50,55 50,5 45,5 45,30, 15,0, 15,60 z"></path>'
	}

	navStyle = [
		'#pow-nav { position:absolute; width:200px; height:70px; left:50%; line-height:0; margin-left:-100px; padding-top:20px; bottom:15px; opacity:0; '+pow.style.disableSelection()+'; }',
		'#pow-nav .nav { display:inline-block; width:48px; height:50px; }',
		'#pow-nav .nav, #pow-nav .status { margin:1px; background:rgba(0,0,0,.85); '+pow.style.shadow('0 3px 3px rgba(0,0,0,.5)')+'; }',
		'#pow-nav .nav:hover { background:rgba(0,0,0,.90); }',
		'#pow-nav .nav:active { background:rgba(0,0,0,1); }',
		'#pow-nav .nav .icon { display:block; margin:20%; width:60%; height:60%; }',
		'#pow-nav .nav.first { border-top-left-radius:10px; }',
		'#pow-nav .nav.last { border-top-right-radius:10px; }',
		'#pow-nav .status { height:20px; line-height:20px; text-align:center; color:#aaa; font-family:sans-serif; border-radius:0 0 10px 10px; }'
	].join('\n')

	pow.nav = {}
	pow.nav.update = pow.slides.on.show(function() {
		pow.nav.statusEl.textContent = pow.slide.index+1 + ' / ' + pow.slides.length
	})
	pow.nav.load = pow.on.load(function() {
		pow.style.get('pow-nav-style').innerHTML = navStyle

		var el = pow.nav.el = pow.el.replace('pow-nav')
		
		;['first', 'prev', 'next', 'last'].forEach(function(name) {
			var button = document.createElement('div')
			button.className = 'nav '+name
			button.innerHTML = '<svg class="icon" viewBox="0 0 60 60">'+icon[name]+'</svg>'
			button.addEventListener('click', function(e) {
				pow.slides.go[name]()
				e.stopPropagation()
			}, false)
			el.appendChild(button)
		})

		var statusEl = pow.nav.statusEl = document.createElement('div')
		statusEl.className = 'status'
		el.appendChild(statusEl)

		var fade = new pow.Animation(250, {
			frame: function(val) {
				el.style.opacity = val
			}
		})
		document.addEventListener('mousemove', function(e) {
			if (e.pageY > el.offsetTop) {
				fade.play()
			} else {
				fade.reverse()
			}
		}, true)
		document.addEventListener('mouseout', function(e) {
			if (!e.relatedTarget) {
				fade.reverse()
			}
		}, false)
		document.addEventListener('keydown', function(e) {
			var action = {
				13: 'next',  // Enter
				32: 'next',  // Space
				37: 'prev',  // Left
				38: 'first', // Top
				39: 'next',  // Right
				40: 'last'   // Down
			}[e.keyCode]
			if (action) { pow.slides.go[action]() }
		}, false)
	})
})
