pow.module('touch', function() {
	pow.touch = {}
	pow.touch.threshold = 50
	pow.touch.gesture = function() {
		if (this.startX == null || this.endX == null) { return }
		if (this.endX - this.startX > this.threshold) {
			pow.slides.go.next()
		} else if (this.endX - this.startX < this.threshold) {
			pow.slides.go.prev()
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
