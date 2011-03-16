pow.module('highlight', function() {
	~highlight.js~
	~javascript.js~
	~html-xml.js~
	var irBlackStyle = ~ir_black.css~
	pow.style.get('pow-highlight-style').innerHTML = irBlackStyle
	hljs.tabReplace = '    '
	hljs.initHighlightingOnLoad()
})
