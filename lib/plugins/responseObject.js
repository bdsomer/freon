// Require statements

const cookie = require('cookie'),
fs = require('fs'),
mime = require('mime'),
path = require('path'),
shouldCompress = require('../shouldCompress'),
zlib = require('zlib'),
Stream = require('stream'),
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
	};

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
	};

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
		if (shouldCompress(this.app.notFoundPage.length)) {
			this.endCompressed(this.app.notFoundPage, null, null, 404);
		} else {
			this.end(this.app.notFoundPage);
		}
	};

	res.endFile = function(filePath, cb, statusCode) {

		// Set defaults

		statusCode = statusCode || 200;

		// Callback defaults to empty function

		cb = cb || function() { };

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

				this.setHeader('contentType', contentType);
				this.setHeader('lastModified', lastModified);

				/**
				 * The read stream of the file.
				 */
				const readStream = fs.createReadStream(filePath);

				if (shouldCompress(stats.size, filePath)) {
					this.endCompressed(readStream, null, cb, statusCode);
				} else {
					this.writeHead(statusCode);
					readStream.pipe(this);
				}
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

			this.setHeader('contentType', mime.lookup(contentPath));
		}
		this.setHeader('contentDisposition', contentDisposition);
	};

	res.uploadFile = function(filePath, cb, statusCode) {

		// Call attachContent

		this.attachContent(filePath);

		// Upload the file

		this.endFile(filePath, cb, statusCode);
	};

	res.endCompressed = function (data, compressionMethod, cb, statusCode) {

		// Validate compressionMethod

		if (compressionMethod && compressionMethod !== 'gzip' && compressionMethod !== 'deflate') {
			throw new Error('Unsupported compression method "' + compressionMethod + '".');
		}

		// Set defaults

		statusCode = statusCode || 200;
		cb = cb || function() { };
		if (!compressionMethod) {
			const gzipIndex = req.acceptEncodings.indexOf('gzip');
			const deflateIndex = req.acceptEncodings.indexOf('deflate');
			if (gzipIndex === -1 && deflateIndex === -1) {

				// No compression support, send data raw

				this.writeHead(statusCode);
				data.pipe(this);
				return;
			} else {

				// The client supports gzip or deflate
				// Check what method the client prefers

				compressionMethod = gzipIndex < deflateIndex ? 'gzip' : 'deflate';
			}
		}

		// Set the Content-Encoding header

		this.writeHead(statusCode, {
			'contentEncoding' : compressionMethod
		});

		if (data instanceof Stream) {

			// Data is a stream, pipe it

			try {
				const compressor = compressionMethod === 'gzip' ? zlib.createGzip() : zlib.createDeflate();
				data.pipe(compressor).pipe(this);
			} catch (err) {

				// Callback on error

				cb(err);
			}
		} else {

			// Compress the data using the specified compression method

			zlib[compressionMethod](data, (err, compressedData) => {

				// Check for an error

				if (err) {
					cb(err);
				} else {
					this.end(compressedData);
					cb();
				}
			});
		}
	};

	next();
};