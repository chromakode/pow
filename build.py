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
    def __init__(self, name, src, includes=None):
        self.name = name
        self.src = src
        self.includes = includes

    def build(self):
        if self.includes:
            data = open(self.src).read()
            for name, include in self.includes.iteritems():
                data = data.replace('~{0}~'.format(name), include.read())
            src = self.src + '.out'
            open(src, 'w').write(data)
            return src
        else:
            return self.src

    def get_version(self):
        p = Popen(['git', 'log', '--format=format:%ct', '-n 1', self.src], stdout=PIPE, stderr=PIPE)
        out, msg = p.communicate()
        return int(out) if out else 0

class ModuleFile:
    def __init__(self, src):
        self.src = src

    def read(self):
        return open(self.src).read()

class ModuleFileData(ModuleFile):
    def read(self):
        return repr(ModuleFile.read(self))

class Bundle:
    def __init__(self, name, header, modules):
        self.name = name
        self.header = header
        self.modules = modules

    def get_versions(self):
        return dict((module.name, module.get_version()) for module in self.modules)

    def build(self, closure, versions=None, wrap_fmt=None, extra_data=None):
        src = closure.compile(module.build() for module in self.modules)
        header = self.header.replace('\n', '\n// ')
        versions = versions or self.get_versions()
        wrap_fmt = wrap_fmt or '\n'.join([
            '// {header}',
            'pow.bundle({bundle})'])
        bundle = {
            'versions': versions,
            'data': src,
            'wrap': wrap_fmt.format(header=header, bundle='~b~')
        }
        if (extra_data): bundle.update(extra_data)
        return bundle['wrap'].replace('~b~', json.dumps(bundle, indent=1, sort_keys=True))

class InitBundle(Bundle):
    def build(self, closure):
        # Include the init module in the versions mapping but not the code
        init = Module('init', 'src/pow.init.js')
        versions = self.get_versions()
        versions['init'] = init.get_version()

        # To bootstrap, call the init module if pow is not defined.
        loader_wrap_fmt = '\n'.join([
            '// {header}',
            '(function(b) {{ if (!window.pow) eval(b.init); pow.bundle(b); }})({bundle})'])

        # Build bundle with a special init property containing the init module.
        return Bundle.build(self, closure,
            versions=versions,
            wrap_fmt=loader_wrap_fmt,
            extra_data={'init': closure.compile([init.src])})

bundles = [{
    'name': 'pow',
    'class': InitBundle,
    'filename': 'pow.js',
    'header': '\n'.join([
        '<body style="display:none" onload="window.location.href=\'http://usepow.com/about\'">',
        'POW: a simple javascript presentation tool.',
        'source code: http://github.com/chromakode/pow']),
    'modules': [
        Module('compat', 'src/pow.compat.js'),
        Module('core', 'src/pow.core.js'),
        Module('nav', 'src/pow.nav.js')],
}, {
    'name': 'highlight',
    'header': '\n'.join([
        'pow.highlight: syntax highlighting for pow.',
        'Thanks to http://softwaremaniacs.org/soft/highlight/en/']),
    'modules': [
        Module('highlight', 'modules/highlight/pow.highlight.js', {
            'highlight.js': ModuleFile('modules/highlight/highlight.js'),
            'javascript.js': ModuleFile('modules/highlight/javascript.js'),
            'html-xml.js': ModuleFile('modules/highlight/html-xml.js'),
            'ir_black.css': ModuleFileData('modules/highlight/ir_black.css')})],
}]

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
        for data in bundles:
            cls = data.get('class', Bundle)
            filename = data.get('filename', 'pow.{0}.js'.format(data['name']))
            bundle = cls(data['name'], data['header'], data['modules'])
            open(filename, 'w').write(bundle.build(closure))
            print 'Built bundle {0}: {1}'.format(data['name'], filename)

    except ClosureError, e:
        print "ERROR: An unknown error occurred running Closure Compiler:"
        print e
        sys.exit(1)

if __name__ == '__main__':
    main()
