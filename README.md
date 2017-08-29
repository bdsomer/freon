# freon
Fast server-side web framework

[![freon on NPM](https://nodei.co/npm/freon.png)](https://npmjs.com/package/freon)

[![Build Status](https://travis-ci.org/bdsomer/freon.svg?branch=master)](https://travis-ci.org/bdsomer/freon) ![freon's Total Downloads on NPM](https://img.shields.io/npm/dt/freon.svg) ![freon's Version on NPM](https://img.shields.io/npm/v/freon.svg) [![bitHound Overall Score](https://www.bithound.io/github/bdsomer/freon/badges/score.svg)](https://www.bithound.io/github/bdsomer/freon) [![bitHound Code](https://www.bithound.io/github/bdsomer/freon/badges/code.svg)](https://www.bithound.io/github/bdsomer/freon) [![Dependencies](https://www.bithound.io/github/bdsomer/freon/badges/dependencies.svg)](https://www.bithound.io/github/bdsomer/freon/master/dependencies/npm) [![Dev Dependencies](https://www.bithound.io/github/bdsomer/freon/badges/devDependencies.svg)](https://www.bithound.io/github/bdsomer/freon/master/dependencies/npm) [![Known Vulnerabilities](https://snyk.io/test/github/bdsomer/freon/badge.svg)](https://snyk.io/test/github/bdsomer/freon) ![freon's License](https://img.shields.io/npm/l/freon.svg) [![freon's Stars on GitHub](https://img.shields.io/github/stars/bdsomer/freon.svg?style=social&label=Star)](https://github.com/bdsomer/freon)

# Example

```javascript
const Freon = require('freon');
const app = new Freon.Application(['example.com', /.+\.example\.com/]);
app.onGet(/\/.+\.html/, (req, res) => {
  // Server code..
});
```

# API

```javascript
const Freon = require('freon');
```

# `Freon.Application`

See [the Application docs](https://bdsomer.github.io/freon/Application.html)

# Plugins

Plugins are trivial to create for freon. For example, a plugin that injects a property `foo` into the request object and sets it to `'bar'`:

```javascript
// fooBarPlugin.js

module.exports = (req, res, next) => {
  req.foo = 'bar';
  next();
}
```

Note that it is vital to call `next()` when the plugin is finished loading. If any plugin does not call `next()`, then the server will halt when it is requested, waiting for that plugin to load, which it never will.

To load this plugin:

```javascript
// server.js

const app = new Freon.application(['example.com']);
app.plugin(require('./fooBarPlugin.js'));
```

## static

Use `Freon.static` to serve a static folder. It will be compressed using `gzip` and `deflate`, send the `Last-Modified` header, and send `304` status codes without a body when possible. If the file is not found in the directory, it will then pass on the request to the next handlers.

```javascript
const app = new Freon.application(['example.com']);
app.plugin(Freon.static('someRandomDir/theDirToServeWebFilesFrom'));
```

## Other useful plugins

You may find these plugins useful:
- [`freon-cookies`](https://npmjs.com/package/freon-cookies)
- [`freon-user-agent`](https://npmjs.com/package/freon-user-agent)

Freon will overwrite the request and response object. See the properties and methods that are added:

[Request Object](https://bdsomer.github.io/freon/DefaultRequestPlugin.html)

[Response Object](https://bdsomer.github.io/freon/DefaultResponsePlugin.html)