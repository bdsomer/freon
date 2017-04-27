// Require statements

const cookie = require('cookie'),
fs = require('fs'),
mime = require('mime'),
path = require('path'),
camelCaseHeaders = require('../camelCaseHeaders');

module.exports = function(req, res, next) {

	// ---
	// Response Object Properties
	// ---

	res.cookies = { };

	// ---
	// Response Object Methods
	// ---

	res.addCookie = function(name, value, options) {

		// Add this cookie to the res.cookies property

		this.cookies[name] = {
			'value' : value,
			'options' : options
		};    
	};

	res.addCookies = function(...cookies) {

		// Call res.addCookie on each element

		cookies.forEach(cookie => this.addCookie(cookie.name, cookie.value, cookie.options));
	};

	res.removeCookie = function(name) {

		// Remove this cookie from the res.cookies property

		this.cookies[name] = undefined;
	};

	res.removeCookies = function(...names) {

		// Call res.removeCookie on each element

		names.forEach(name => this.removeCookie(name));
	};

	res.deleteCookie = function(name) {

		// Make the cookie expired

		this.addCookie(name, '', {
			'expires' : new Date(0)
		});
	};

	res.deleteCookies = function(...names) {

		// Call res.deleteCookie on each element

		names.forEach(name => this.deleteCookie(name));
	}

	// Make sure to initalize the 'Set-Cookie' header on res.writeHead

	const _writeHead = res.writeHead;

	res.writeHead = function(...args) {

		// Serialize the cookies

		var cookieArray = Object.entries(this.cookies).map(([cookieName, cookieInfo]) => {

			// Make sure this cookie has not been deleted

			if (cookieInfo) {

				// If it has not been, serialize it

				return cookie.serialize(cookieName, cookieInfo.value, cookieInfo.options);
			}
		}).filter(element => {

			// Remove all 'undefined' cookies

			if (element) return true;
		});

		// Set the 'Set-Cookie' header

		this.setHeader('setCookie', cookieArray);

		// Call the default 'writeHead' method

		_writeHead.call(this, ...args);
	};

	// Make setHeader use camelCase headers

	const _setHeader = res.setHeader;

	res.setHeader = function(name, value) {
		_setHeader.call(this, camelCaseHeaders.camelStringToHeader(name), value);
	}

	res.redirect = function(url, statusCode) {

		// statusCode defaults to 302

		statusCode = statusCode || 302;

		// Write the 'Location' header

		this.writeHead(statusCode, {
			'location' : url
		});

		// End the request

		this.end();
	};

	res.send404 = function() {
		this.writeHead(404, this.app.notFoundPageHeaders);
		this.end(this.app.notFoundPage);
	};

	res.endFile = function(filePath, cb) {

		// Callback defaults to empty function

		cb = cb || function() { };

		// Read the file

		fs.readFile(filePath, (err, data) => {

			// Check for an error

			if (err) {

				// If there was, call back with it

				cb(err);
			} else {
				
				// If not, send the file

				// Get last modified date

				fs.stat(filePath, (err, stats) => {

					// Check for an error

					if (err) {
						
						// If there was, call back with it

						cb(err);
					} else {

						// If not, continue sending the file

						/**
						 * The content type of the file.
						 */
						const contentType = mime.lookup(filePath);

						/**
						 * The date the file was last modified.
						 */
						const lastModified = stats.mtime;

						// Set headers

						this.writeHead(200, { contentType, lastModified });
						
						// Send the data

						this.end(data);

						// Call back

						cb();
					}
				});
			}
		});
	};

	res.attachContent = function(contentPath) {

		// Create the Content-Disposition header

		var contentDisposition = 'attachment';

		// Check if contentPath was passed in

		if (contentPath) {

			// If so, append the filename attribute

			contentDisposition += '; filename="' + path.basename(contentPath) + '"';
			
			// Also set the content type
			// Use _setHeader for performance

			_setHeader('Content-Type', mime.lookup(contentPath));
		}

		// Use _setHeader for performance

		_setHeader('Content-Disposition', contentDisposition);
	};

	res.uploadFile = function(filePath, cb) {

		// Call attachContent

		this.attachContent(filePath);

		// Upload the file

		this.uploadFile(filePath, cb);
	};

	next();
}