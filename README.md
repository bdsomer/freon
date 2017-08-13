# freon
Fast server-side web framework

[![freon on NPM](https://nodei.co/npm/freon.png)](https://npmjs.com/package/freon)

[![Build Status](https://travis-ci.org/bdsomer/freon.svg?branch=master)](https://travis-ci.org/bdsomer/freon) ![freon's Total Downloads on NPM](https://img.shields.io/npm/dt/freon.svg) ![freon's Version on NPM](https://img.shields.io/npm/v/freon.svg) [![bitHound Overall Score](https://www.bithound.io/github/bdsomer/freon/badges/score.svg)](https://www.bithound.io/github/bdsomer/freon) [![bitHound Code](https://www.bithound.io/github/bdsomer/freon/badges/code.svg)](https://www.bithound.io/github/bdsomer/freon) [![Dependencies](https://www.bithound.io/github/bdsomer/freon/badges/dependencies.svg)](https://www.bithound.io/github/bdsomer/freon/master/dependencies/npm) [![Dev Dependencies](https://www.bithound.io/github/bdsomer/freon/badges/devDependencies.svg)](https://www.bithound.io/github/bdsomer/freon/master/dependencies/npm) [![Known Vulnerabilities](https://snyk.io/test/github/bdsomer/freon/badge.svg)](https://snyk.io/test/github/bdsomer/freon) ![freon's License](https://img.shields.io/npm/l/freon.svg) [![freon's Stars on GitHub](https://img.shields.io/github/stars/bdsomer/freon.svg?style=social&label=Star)](https://github.com/bdsomer/freon)

# Example

```javascript
const Freon = require('freon');
const app = new Freon.Application(['example.com', /.+\.example\.com/]);
app.onGet(/\/.+\.html/, (req, res, next) => {
  // Server code...
});
```

# API

```javascript
const Freon = require('freon');
```

# `Freon.Application`

- `constructor(domains, notFoundPage?, notFoundPageHeaders?, maxClientBytes?)` - creates an application.
  - `domains: String[]|RegExp[]?` - a list of domains to listen on, ex. `['example.com', /.+\.example.com/]`. Defaults to accept all requests.
  - `notFoundPage: String|BufferType?` - a page to be served when no handlers are found. Defaults to `''`.
  - `notFoundPageHeaders: {String : String}?` - headers to be served when no handlers are found. Defaults to `{'contentType' : 'text/plain'}`.
    - **note** the keys of this object are `camelCase`, not the usual `Non-Camel-Case`.
  - `maxClientBytes: Number?` - the maximum number of bytes that the client is allowed to send in the body before the connection is destroyed. Use this to prevent denial of service attacks. By default, it is left undefined, allowing an infinite number of bytes.
- `on(options, callback)` - adds a handler.
  - `options: {method: String|RegExp, pathname: String|RegExp}` - Which method to listen for and which path to listen on. For example, `method` could be `'POST'` and `pathname` could be `/\/.+/`
  - `callback: Function` - the function that is to be called when a request is made with the specified `method` and `path`
    - `request: ClientRequest` - the request sent by the client. See the [Node.js docs](https://nodejs.org/dist/latest-v6.x/docs/api/http.html#http_class_http_clientrequest).
    - `response: ServerResponse` - the response that is to be sent by the server. See the [Node.js docs](https://nodejs.org/dist/latest-v6.x/docs/api/http.html#http_class_http_serverresponse).
    - `regExpResult: Array` - the result of the execution of the `options.path` regular expression. Not defined if `options.path` is a String.
- `onGet(path, callback), onPost(path, callback), onPut(path, callback), onDelete(path, callback)` - shorthands of calling `on(options, callback)`.
  - `path: String|RegExp` - the path to listen for.
  - `callback: Function` - what to call back to when a request is made to this handler. See `on(options, callback)` for more information.
- `onAny(path, callback)` - listens for any connection on the specified path.
  - `path` - the path to listen for.
  - `callback` - what to call back to when a request is made to this handler. See `on(options, callback)` for more information.
- `listen(port, callback, httpsPort, httpsOptions)` - starts the server.
  - `port: Number` - the TCP port to listen on for HTTP requests.
  - `callback: Function?` - What to call back to when the server starts.
  - `httpsPort: Number?` - the TCP port to listen on for HTTPS requests.
  - `httpsOptions: Object?` - the `key` and `cert` to use (in PEM format) or the `pfx` data to use. See the [Node.js docs](https://nodejs.org/docs/latest-v5.x/api/https.html#https_https_createserver_options_requestlistener).
- `plugin(plugin)` - adds a plugin.
  - `plugin: Function` - the plugin to load. See documentation below.
- `testRequest(req, res)` - sends a "fake" request. Should only be used for testing.
  - `req: Object` - the request object. By default, some fields are set, such as `connection.remoteAddress`.
  - `res: Object` - the response object. By default, some fields are set, such as `res.setHeader`.
- `notFoundPage: String|Buffer` - the page to be served when no handlers were found or when the client's `Host` header did not match one of the application's domains.
- `notFoundPageHeader: {String : String}` - the headers to be served when no handlers were found or when the client's `Host` header did not match one of the application's domains.
- `handlers: {options: {method: String, pathname: String|RegExp}, callback: Function}[]` - the application's handlers.
- `plugins: Function[]` - the plugins that this app has loaded.

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

## shouldCompress

Use `Freon.shouldCompress` to detect if compressing a file would be a good descision. For more information, see [this](http://www.itworld.com/article/2693941/cloud-computing/why-it-doesn-t-make-sense-to-gzip-all-content-from-your-web-server.html) article.

To get the file size, it is reccomended that you use the `fs.stats` method to extract the `size` property.

```javascript
Freon.shouldCompress(25, '/path/to/file.txt'); // false, file is too small
Freon.shouldCompress(50000, '/vendor/css/bigcss.min.css'); // true
Freon.shouldCompress(3000, 'myImage.png'); // false, compressing images could make them larger
```

Freon will overwrite the request and response object. The properties and methods that it adds are as follows.

# Request Object

## Properties

- `headers: {String : String}` - camelCase headers.
- `url: {String : String}` - a parsed version of `req.url`. See the [Node.js docs](https://nodejs.org/dist/latest-v6.x/docs/api/url.html).
- `body: Buffer` - the data sent by the client.
- `cookies: {String : String}` - cookies sent by the client.
- `ip: String` - external request IP address.
  - **note** this property gives the `X-Forwarded-For` header priority, making it very easy to spoof. Use `connectionIp` instead for a much more legitament IP address.
- `connectionIp: String` - external request IP address. A shorthand of `req.connection.remoteAddress`.
- `query: {String : String}` - a parsed version of `req.url.query`.
- `secure: Boolean` - `true` if the protocol being used is HTTPS, `false` otherwise.
- `userAgent: Object` - a parsed version of the `User-Agent` header.
  - `full: String` - the full `User-Agent` header.
  - `name: String` - the name of the browser.
  - `version: String` - the version of the browser.
  - `fullName: String` - the name and version of the browser, concatenated.
  - `os: String` - the name and version of the OS.
- `acceptTypes: String[]` - a list of content types that the client accepts, most preferred first.
- `acceptEncodings: String[]` - a list of encodings that the client accepts, most preferred first.
- `acceptLanguages: String[]` - a list of languages that the client accepts, most preferred first.

## Methods

- `accepts(type)` - checks if the client accepts the specified content type.
  - `type: String` - the type to check if the client accepts, ex. `text/html` or `application/json`.
- `acceptsEncoding(encoding)` - checks if the client accepts the specified encoding.
  - `encoding: String` - the encoding to check if the client accepts, ex. `gzip` or `deflate`.
- `acceptsLanguage(language)` - checks if the client accepts the specified language.
  - `language: String` - the language to check if the client accepts, ex. `en` or `es`.

# Response Object

**Note** that it is very important not to set the `Set-Cookie` header manually.

## Properties

- `cookies: {String : {value : String, options : Object}}` - cookies that will be sent to the client. The key is the name of the cookie. As per the `options` paramater, see the documentation for the [`cookie` module](https://www.npmjs.com/package/cookie).
- `app: Freon.Application` - the application that is handling this request.

## Methods

- `addCookie(name, value, options?)` - adds a cookie to be sent.
  - `name: String` - the name/key of the cookie.
  - `value: String` - the value/data of the cookie.
  - `options: Object?` - cookie options. See the documentation for the [`cookie` module](https://www.npmjs.com/package/cookie).
- `addCookies({name: string, value: string, options?: object}...)` - adds multiple cookies using the `addCookie(name, value, options)` method.
- `removeCookie(name)` - stops the cookie with the specified name from being sent or from being deleted.
  - `name: String` - the name of the cookie to stop from being sent or from being deleted.
- `removeCookies(names...)` - stops the cookies with the specified names from being sent or from being deleted using the `removeCookie(name)` method.
- `deleteCookie(name)` - deletes the cookie **from the client** with the specified name.
  - `name: String` - the name of the cookie to be deleted **from the client** with the specified name.
- `deleteCookies(names...)` - deletes multiple cookies **from the client** with the specified names using the `deleteCookie(name)` method.
- `redirect(url, statusCode?)` - redirects the client with the specified `statusCode`. `statusCode` defaults to 302 (found).
  - `url: String` - the URL to redirect the client to.
  - `statusCode: Number?` - the status code to send to the client with this redirect.
- `send404()` - sends a 404 to the client using `app.notFoundPage`.
- `setHeader(name, value)` - an overwritten version of the normal `setHeader` method that accepts `camelCase` names.
- `writeHead(statusCode, statusMessage?, headers?)` - an overwritten version of the normal `writeHead` method that accepts `camelCase` keys for headers.
- `endFile(filePath, callback?, statusCode?, options?)` - reads the file at the specified path and serves it to the client with a `Content-Type` header and a `Last-Modified` header. It will also compress the data using `gzip` if possible, then `deflate` as a fallback.
  - `filePath: String` - the path to read the data from.
  - `callback(err): Function?` - calls back when the request has been served.
    - `err: Error?` - the error that occured while reading or getting the last modified date of the file. `undefined` if no error occured.
  - `statusCode: Number?` - the status code to send with this request. Defaults to `200`.
  - `options: Object` - options.
    - `lastModified: Boolean` - when set to `true`, a `304` status code will be sent if the client claims to have the most recent version of the file and the `Last-Modified` header will be sent. When set to `false`, `304` status codes are never sent and the `Last-Modified` header will never be sent.
- `attachContent(contentPath?)` - sets a `Content-Disposition` header and a `Content-Type` header, causing the client to open a 'Save File' dialog on the connection end.
  - `contentPath: String?` - if not present, sets the `Content-Disposition` header to `attachment`. If present, sets the `filename` property of the `Content-Disposition` header to the basename of the `contentPath`.
- `uploadFile(filePath, callback?, statusCode?)` - sets a `Content-Disposition` header, `Content-Type` header, and `Last-Modified` header and then sends the file to the client, causing the client to open a 'Save File' dialog.
  - `filePath: String` - the path to read the data from. This paramater is also used to set the filename on download.
  - `callback(err): Function?` - calls back when the request has been served.
    - `err: Error?` - the error that occured while reading or getting the last modified date of the file. `undefined` if no error occured.
  - `statusCode: Number?` - the status code to send with this request. Defaults to `200`.
  - `options: Object` - see `endFile(filePath, callback?, statusCode? options?)`.
- `endCompressed(data, compressionMethod?, callback?, statusCode?, forceCompression?)` - sets a `Content-Encoding` header and sends the data, compressed.
  - `data: Buffer|Stream|String` - the data to compress and send.
  - `compressionMethod: String?` - the compression method to use. Can be `gzip` or `deflate`. If not provided, will choose one, depending on what the client desires.
  - `callback(err): Function?` - calls back when the request has been served.
    - `err: Error?` - the error that occured while reading or getting the last modified date of the file. `undefined` if no error occured.
  - `statusCode: Number?` - the status code to send with this request. Defaults to `200`.
