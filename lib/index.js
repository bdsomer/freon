'use strict';

// Require statements

const http = require('http'),
http2 = require('http2'),
url = require('url'),
camelCaseHeaders = require('./camelCaseHeaders'),
shouldCompress = require('./shouldCompress');

// Object.entries polyfill

const reduce = Function.bind.call(Function.call, Array.prototype.reduce);
const isEnumerable = Function.bind.call(Function.call, Object.prototype.propertyIsEnumerable);
const concat = Function.bind.call(Function.call, Array.prototype.concat);
const keys = Reflect.ownKeys;

if (!Object.values) {
	Object.values = function values(O) {
		return reduce(keys(O), (v, k) => concat(v, typeof k === 'string' && isEnumerable(O, k) ? [O[k]] : []), []);
	};
}

if (!Object.entries) {
	Object.entries = function entries(O) {
		return reduce(keys(O), (e, k) => concat(e, typeof k === 'string' && isEnumerable(O, k) ? [[k, O[k]]] : []), []);
	};
}

const defaultPlugins = ['requestObject', 'responseObject'];

/**
 * @typedef handler
 * @type {Object}
 * @property {string=} method The method to be listening for, ex. `'HEAD'`. Will default to all request methods.
 * @property {string|RegExp} path The path to be listening for ex. `/\/docs\/.+/`
 */

/**
 * @callback handlerCallback
 * @param {Request} request The request sent by the client. See https://nodejs.org/dist/latest-v6.x/docs/api/http.html#http_class_http_clientrequest.
 * @param {Response} response The response to be sent by the server. See https://nodejs.org/dist/latest-v6.x/docs/api/http.html#http_class_http_serverresponse.
 * @param {Function=} next Call after this plugin has finished loading.
 */

/**
 * A Freon application.
 * @property {string|BufferType} notFoundPage The data to be served when no handlers were found.
 * @property {Object.<string, string>} notFoundPageHeaders The headers to send when no handlers were found.
 * @property {{options: handler, callback: Function}} handlers The applications' handlers.
 * @class
 */
class Application {
	
	/**
	 * Creates a new Freon application.
	 * @param {string[]|RegExp[]=} domains The list of domains to listen on (ex. `['example.com', /.+\.example.com/]`).
	 * @param {string|BufferType} [notFoundPage=''] The data to be served when no handlers were found.
	 * @param {Object.<string, string>} [notFoundPageHeaders={'Content-Type':'text/plain'}] The headers to send when no handlers were found.
	 */
	constructor (domains, notFoundPage, notFoundPageHeaders) {

		// Set domains to accept everything by default

		domains = domains || [/.+/];

		// Loop through the domains to sort them by RegExps and Strings

		this.domains = {}, this.domains.regExps = [], this.domains.strings = [];

		domains.forEach(element => {

			// Push to the domains.regExps array for RegExps or the domains.strings array for Strings

			if (element instanceof RegExp) {
				this.domains.regExps.push(element);
			} else if (typeof element === 'string') {
				this.domains.strings.push(element);
			} else {
				throw new Error('Domains must be a regular expression or a string.');
			}
		});

		// Set this.notFoundPage and default to an empty string

		this.notFoundPage = notFoundPage || '';

		// Set notFoundPageHeaders

		this.notFoundPageHeaders = notFoundPageHeaders || {
			'contentType'	: 'text/plain'
		};
		this.notFoundPageHeaders = camelCaseHeaders.camelObjectToHeader(this.notFoundPageHeaders);

		// Set this.handlers and this.plugins to an empty array

		this.handlers = [];
		this.plugins = [];

		// Load default plugins

		for (let i = 0; i < defaultPlugins.length; i++) {
			this.plugin(require('./plugins/' + defaultPlugins[i]));
		}
	}

	/**
	 * Freon's request handler. This function should not be called directly.
	 * @param {request} req The incoming request.
	 * @param {response} res The response to be sent.
	 */
	request (req, res) {

		res.send404 = function() {
			this.writeHead(404, this.app.notFoundPageHeaders);
			if (shouldCompress(this.app.notFoundPage.length)) {
				this.endCompressed(this.app.notFoundPage, null, null, 404);
			} else {
				this.end(this.app.notFoundPage);
			}
		};
		
		// Check if this application is applicable

		let host = req.headers.host;

		// Check strings

		const strings = this.domains.strings;
		if (strings.indexOf(host) === -1) {

			// Check RegExps

			var canHandleRequest = false;

			const regExps = this.domains.regExps;
			for (let i = 0; i < regExps.length; i++) {
				if (regExps[i].test(host)) {

					// We can handle this request, keep going

					canHandleRequest = true;
				}
			}

			if (!canHandleRequest) {

				// We can't handle this request, send a 404 and return

				res.send404();
				return;
			}
		}

		// Load plugins

		var currentPlugin = 0;

		// Set req.url to a parsed version of itself for the static plugin
		// Only parse it if requested

		const oldUrl = req.url;

		Object.defineProperty(req, 'url', {
			'get' : function() {
				if (this.___url) {
					return this.___url;
				} else {
					this.___url = url.parse(oldUrl);
					return this.___url;
				}
			}
		});

		const loadPlugins = callback => {

			// Check if there are no more plugins to load

			if (currentPlugin < this.plugins.length) {

				// Load the plugin

				this.plugins[currentPlugin](req, res, () => {

					// When it is finished loading, load the next one

					currentPlugin++;
					loadPlugins(callback);
				});
			} else {

				// If we are finished, call back

				callback();

			}
		};

		loadPlugins(() => {
			// Check for a handler for this request if the plugin did not modify the request

			if (!req.headerSent) {

				var handlerCallback;

				for (let i = 0; i < this.handlers.length; i++) {
					const currentHandler = this.handlers[i];

					// If a method is specified (it does not accept all methods) and it is not the same as the current request method, skip this handler

					if (currentHandler.options.method && currentHandler.options.method !== req.method) continue;

					// Check if the request path matches

					const requestPath = req.url.pathname;

					if (currentHandler.options.pathname !== requestPath) {

						// If it doesn't, check if it is a RegExp
						// If it isn't a RegExp, skip this handler
						// If it is a RegExp but doesn't match the path, skip this handler

						if (!(currentHandler.options.pathname instanceof RegExp) || !currentHandler.options.pathname.test(requestPath)) continue;
					}

					// All checks have passed, this is the handler

					handlerCallback = currentHandler.callback;

					// No need to search for more handlers, only one can handle the request anyway

					break;
				}

				// Check that a handler was found

				if (handlerCallback) {
					// Set the app property

					res.app = this;

					// Call the handler

					handlerCallback(req, res);
				} else {

					// If no handlers were found, send a 404

					res.send404();
				}
			}
		});
	}

	/** Adds a handler. For example: myApp.on({
	 *	 'path' : /\/.+\//,
	 *	 'method' : 'GET'
	 * }, (req, res) => {
	 *	 // Code...
	 * });
	 * @param {handler} options Options object.
	 * @param {handlerCallback} callback What to call back to when a request is made to this handler.
	*/

	on (options, callback) {

		// Add the handler

		this.handlers.push({
			'options' : options,
			'callback' : callback
		});
	}

	/**
	 * Adds a plugin to the application.
	 * @param {function} plugin The function to be called to load this plugin on a request.
	 */
	plugin(plugin) {
		this.plugins.push(plugin);
	}

	/**
	 * Adds a handler for a GET request. Simply calls the `on` method.
	 * @param {string|RegExp} path The path to listen for.
	 * @param {handlerCallback} callback What to call back to when a request is made to this handler.
	 */
	onGet (pathname, callback) {
		this.on({
			'method' : 'GET',
			'pathname' : pathname
		}, callback);
	}

	/**
	 * Adds a handler for a POST request. Simply calls the `on` method.
	 * @param {string|RegExp} path The path to listen for.
	 * @param {handlerCallback} callback What to call back to when a request is made to this handler.
	 */
	onPost (pathname, callback) {
		this.on({
			'method' : 'POST',
			'pathname' : pathname
		}, callback);
	}

	/**
	 * Adds a handler for a PUT request. Simply calls the `on` method.
	 * @param {string|RegExp} path The path to listen for.
	 * @param {handlerCallback} callback What to call back to when a request is made to this handler.
	 */
	onPut (pathname, callback) {
		this.on({
			'method' : 'PUT',
			'pathname' : pathname
		}, callback);
	}

	/**
	 * Adds a handler for a PUT request. Simply calls the `on` method.
	 * @param {string|RegExp} path The path to listen for.
	 * @param {handlerCallback} callback What to call back to when a request is made to this handler.
	 */
	onDelete (pathname, callback) {
		this.on({
			'method' : 'DELETE',
			'pathname' : pathname
		}, callback);
	}

	/**
	 * Adds a handler for any request method. Simply calls the `on` method.
	 * @param {string|RegExp} path The path to listen for.
	 * @param {handlerCallback} callback What to call back to when a request is made to this handler.
	 */
	onAny (pathname, callback) {
		this.on({
			'pathname' : pathname
		}, callback);
	}

	/**
	 * Should only be used for testing. Sends a 'fake' request.
	 * @param {request} req The request.
	 * @param {response} res The response.
	 */
	testRequest(req, res) {
		req.headers = req.headers || {};
		req.headers = Object.assign({
			'host' : 'localhost'
		}, req.headers);
		this.request(req, res);
	}

	/** Starts the server.
	 * @param {Whole Number} port The port to host the HTTP server on.
	 * @param {Function=} callback What to call back to when the server starts.
	 * @param {Whole Number=} httpsPort The port to host the HTTPS server on.
	 * @param {JS Object=} httpsOptions The 'key' and 'cert' to use in PEM format or the 'pfx' data to use. See https://nodejs.org/docs/latest-v5.x/api/https.html#https_https_createserver_options_requestlistener.
	*/

	listen (port, callback, httpsPort, httpsOptions) {

		// Create the request handler

		const requestHandler = this.request.bind(this);

		// Create an HTTP server

		this.httpServer = http.createServer(requestHandler);

		// Create an HTTPS server, if desired

		if (httpsOptions) {

			// Create the server with the options

			this.http2Server = http2.createServer(httpsOptions, requestHandler);

			// Start listening for connections 

			this.http2Server.listen(httpsPort, () => {

				// Start the HTTP server when the HTTPS server is done hosting, then call back

				this.httpServer.listen(port, callback);
			});

			// Prevent the HTTP server from starting before the HTTPS server

			return;
		}

		// Start the HTTP server and call back

		this.httpServer.listen(port, callback);
	}
}

// Export the Freon application class

module.exports = {
	Application,
	shouldCompress,
	static: require('./plugins/static')
};