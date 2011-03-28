pow.module('touch', function() {
	pow.touch = {}
	pow.touch.threshold = 50
	pow.touch.gesture = function() {
		var dx = this.endX - this.startX
		if (!dx) {
			return
		} else if (Math.abs(dx) > this.threshold) {
			pow.slides.go[dx < 0 ? 'next' : 'prev']()
		}
	}
	
	window.addEventListener('touchstart', function(e) {
		pow.touch.startX = e.touches[0].pageX
	}, true)
	window.addEventListener('touchmove', function(e) {
		pow.touch.endX = e.touches[0].pageX
	}, true)
	window.addEventListener('touchend', function(e) {
		pow.touch.gesture()
		pow.touch.startX = pow.touch.endX = null
	}, true)
})
