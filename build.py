#!/usr/bin/env python
import sys
import re
from subprocess import Popen, PIPE
import json

class ClosureError(Exception): pass
class Closure:
    def __init__(self, jarpath, args):
        self.jarpath = jarpath
        self.args = args

    def _run(self, args, expected_code=0):
        p = Popen(['java', '-jar', self.jarpath] + self.args + args, stdout=PIPE, stderr=PIPE)
        out, msg = p.communicate()
        if p.returncode != expected_code:
            raise ClosureError(msg)
        else:
            return out, msg

    def version(self):
        out, msg = self._run(['--version', '--help'], 255)
        return int(re.search('Version: (\d+)', msg).group(1))

    def compile(self, scripts, args=None):
        args = args or []
        for script in scripts:
            args.append('--js')
            args.append(script)
        return self._run(args)[0]

class Module:
    def __init__(self, name, src, exclude=False):
        self.name = name
        self.src = src
        self.exclude = exclude

    def get_version(self):
        p = Popen(['git', 'log', '--format=format:%ct', '-n 1', self.src], stdout=PIPE, stderr=PIPE)
        out, msg = p.communicate()
        return int(out)

def build_bundle(closure, name, header, modules, wrap_fmt=None, extra_data=None):
    src = closure.compile(module.src for module in modules if not module.exclude)
    header = header.replace('\n', '\n// ')
    versions = dict((module.name, module.get_version()) for module in modules)
    wrap_fmt = wrap_fmt or '\n'.join([
        '// {header}',
        'pow.module.load({bundle})'])
    bundle = {
        'versions': versions,
        'data': src,
        'wrap': wrap_fmt.format(header=header, bundle='~b~')
    }
    if (extra_data): bundle.update(extra_data)
    return wrap_fmt.format(header=header, bundle=json.dumps(bundle, indent=1, sort_keys=True))

init = Module('init', 'pow.init.js', True)
bundles = {}
bundles['pow'] = {
    'name': 'pow',
    'header': '\n'.join([
        '<body style="display:none" onload="window.location.href=\'http://usepow.com/about\'">',
        'POW: a simple javascript presentation tool.',
        'source code: http://github.com/chromakode/pow']),
    'modules': [
        init,
        Module('compat', 'pow.compat.js'),
        Module('core', 'pow.core.js'),
        Module('nav', 'pow.nav.js')],
}

def main():
    if len(sys.argv) < 2:
        print "Usage: build.py path-to-closure-compiler"
        sys.exit(1)

    closure = Closure(sys.argv[1], [
        '--language_in=ECMASCRIPT5',
        '--compilation_level=SIMPLE_OPTIMIZATIONS'])
    if closure.version() < 771:
        print "ERROR: Old version of Closure Compiler detected: at least 771 is required."
        sys.exit(1)

    try:
        pow = bundles['pow']
        loader_wrap_fmt = '\n'.join([
            '// {header}',
            '(function(b) {{ if (!window.pow) eval(b.init); pow.module.load(b); }})({bundle})'])
        bundle_data = build_bundle(closure, wrap_fmt=loader_wrap_fmt, extra_data={'init': closure.compile([init.src])}, **pow)
        open(pow['name']+'.js', 'w').write(bundle_data)
    except ClosureError, e:
        print "ERROR: An unknown error occurred running Closure Compiler:"
        print e
        sys.exit(1)

if __name__ == '__main__':
    main()
