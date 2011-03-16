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
	
	if (loading && loading[name] <= moduleInfo.version) { return }
	pow.module.info[name] = {version: loading ? loading[name] : 'dev'}
	pow.log('Running module ['+name+'].')
	run()
}
pow.module.info = {}
pow.updating = window.location.hash == '#update'
pow.bundle = function(bundle) {
	function lastScript() {
		var scripts = document.getElementsByTagName('script')
		return scripts[scripts.length-1]
	}

	function runBundle() {
		pow.log('Running bundle {'+origin+'}.')
		pow.module.loading = bundle.versions
		eval(bundle.data)
		delete pow.module.loading
	}

	var script = lastScript(),
		origin = script.src || script.getAttribute('data-origin'),
		parent = script.parentNode

	if (script.hasAttribute('data-origin')) {
		if (pow.updating && !script.hasAttribute('data-loaded')) {
			pow.log('Updating bundle {'+origin+'}.')
			document.write('<script src="'+origin+'"></script>')
			var newScript = lastScript()
			newScript.addEventListener('load', function() {
				pow.log('Successfully updated bundle {'+origin+'}.')
				parent.removeChild(script)
			}, false)
			newScript.addEventListener('error', function() {
				pow.log('Failed to update bundle {'+origin+'}. Using local version.')
				parent.removeChild(newScript)
				runBundle()
			}, false)
		} else {
			runBundle()
		}
		script.removeAttribute('data-loaded')
	} else {
		pow.log('Inlining loaded bundle {'+origin+'}.')
		var inlineScript = document.createElement('script')
		inlineScript.innerHTML = bundle.wrap.replace('~b~', JSON.stringify(bundle))
		inlineScript.setAttribute('data-origin', origin)
		inlineScript.setAttribute('data-loaded', true)
		parent.removeChild(script)
		parent.insertBefore(inlineScript, inlineScript.nextSibling)
	}
}
