(function() {
	var icon = {
		first: '<svg class="icon"><path d="M 15,30 15,55 10,55 10,5 15,5 15,30, 45,0, 45,60 z"></path></svg>',
		prev: '<svg class="icon"><path d="M 15,30, 45,0, 45,60 z"></path></svg>',
		next: '<svg class="icon"><path d="M 45,30, 15,0, 15,60 z"></path></svg>',
		last: '<svg class="icon"><path d="M 45,30 45,55 50,55 50,5 45,5 45,30, 15,0, 15,60 z"></path></svg>'
	}

	pow.style.get('pow-nav-style').innerHTML = [
		'#pow-nav { position:absolute; width:400px; height:100px; left:50%; margin-left:-200px; padding-top:20px; bottom:20px; opacity:0; }',
		'#pow-nav .nav { display:inline-block; width:96px; height:100px; margin:2px; background:rgba(0,0,0,.85); '+pow.style.shadow('0 5px 0 rgba(0,0,0,.5)')+'; }',
		'#pow-nav .nav:hover { background:rgba(0,0,0,.90); }',
		'#pow-nav .nav:active { background:rgba(0,0,0,1); '+pow.style.shadow('0 5px 0 rgba(0,0,0,.7)')+'; }',
		'#pow-nav .nav .icon { display:block; padding:20px; width:60px; height:60px; }',
		'#pow-nav .nav path { fill:white; }',
		'#pow-nav .nav.first { border-radius:10px 0 0 10px; }',
		'#pow-nav .nav.last { border-radius:0 10px 10px 0; }'
	].join('\n')

	pow.nav = {}
	pow.nav.button = {
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
	pow.nav.load = pow.on.load(function() {
		var el = this.el = pow.el.replace('pow-nav')
		;['first', 'prev', 'next', 'last'].forEach(function(name) {
			var button = document.createElement('div')
			button.id = "pow-nav"+name
			button.className = 'nav '+name
			button.innerHTML = '<svg class="icon">'+icon[name]+'</svg>'
			button.addEventListener('click', function(e) {
				pow.nav.button[name]()
				e.stopPropagation()
			}, false)
			el.appendChild(button)
			pow.nav.button[name].el = button
		})
		
		var fade = new pow.Animation(250, {
			frame: function(val) {
				el.style.opacity = val
			}
		})
		document.addEventListener('mousemove', function(e) {
			if (e.y > el.offsetTop) {
				fade.play()
			} else {
				fade.reverse()
			}
		}, true)
	})
})()
