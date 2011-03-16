// {POW!}

pow = {}

pow.log = function() {
	if ('console' in window && console.log && pow.log.enabled) {
		console.log.apply(console, arguments)
	}
}
pow.log.enabled = true

pow.log('{POW!}')

pow.module = function(name, run) {
	var moduleInfo = pow.module.info[name] || {version: -1},
		loading = pow.module.loading
	
	if (loading && loading[name] <= moduleInfo.version) { return; }
	pow.module.info[name] = {version: loading ? loading[name] : 'dev'}
	pow.log('Running module ['+name+'].')
	run()
}
pow.module.info = {}
pow.module.load = function(bundle) {
	var scripts = document.getElementsByTagName('script'),
		script = scripts[scripts.length-1],
		origin = script.src || script.getAttribute('data-origin')

	if (script.hasAttribute('data-origin')) {
		pow.log('Running bundle {'+origin+'}.')
		pow.module.loading = bundle.versions
		eval(bundle.data)
		delete pow.module.loading
	} else {
		pow.log('Inlining loaded bundle {'+origin+'}.')
		var inlineScript = document.createElement('script')
		inlineScript.innerHTML = bundle.wrap.replace('~b~', JSON.stringify(bundle))
		inlineScript.setAttribute('data-origin', origin)
		var parent = script.parentNode;
		parent.removeChild(script)
		parent.appendChild(inlineScript)
	}
}
