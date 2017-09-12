// Require statements

const fs = require('fs'),
mime = require('mime'),
path = require('path'),
shouldCompress = require('../shouldCompress.js'),
zlib = require('zlib'),
Stream = require('stream');

module.exports = function(req, res, next) {

	res.redirect = function(url, statusCode) {

		// statusCode defaults to 302

		statusCode = statusCode || 302;

		// Write the 'Location' header and the 'Content-Type' header

		this.writeHead(statusCode, {
			'Location' : url,
			'Content-Type' : 'text/plain'
		});

		// End the request

		this.end();
	};

	res.endFile = function(filePath, cb, statusCode, options) {

		options = options || {
			'lastModified' : true
		};

		// Set defaults

		statusCode = statusCode || 200;

		// Callback defaults to empty function

		cb = cb || function() { };

		// Get last modified date and file size

		fs.stat(filePath, (err, stats) => {

			// Check for an error (or if a directory was requested)

			if (err || stats.isDirectory()) {

				// If there was, call back with an error message

				cb(err || new Error('A directory was requested.'));
			} else {

				// If not, continue sending the file

				/**
				 * The content type of the file.
				 */
				const contentType = mime.lookup(filePath);

				if (options.lastModified) {
					/**
					 * The date the file was last modified.
					 */
					const lastModifiedDate = stats.mtime;

					/**
					 * The date the file was last modified, as a string.
					 */
					const lastModified = lastModifiedDate.toString();

					this.setHeader('Last-Modified', lastModified);

					// Check if we should send a 304

					if (lastModifiedDate <= new Date(req.headers['if-modified-since'])) {
						res.writeHead(304, {
							'Content-Type' : contentType
						});
						res.end();
						cb();
						return;
					}
				}

				// Set headers

				this.setHeader('Content-Type', contentType);

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

			this.setHeader('Content-Type', mime.lookup(contentPath));
		}
		this.setHeader('Content-Disposition', contentDisposition);
	};

	res.uploadFile = function(filePath, cb, statusCode, options) {

		// Call attachContent

		this.attachContent(filePath);

		// Upload the file

		this.endFile(filePath, cb, statusCode, options);
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
				cb();
				return;
			} else {

				// The client supports gzip or deflate
				// Check what method the client prefers

				compressionMethod = gzipIndex < deflateIndex ? 'gzip' : 'deflate';
			}
		}

		// Set the Content-Encoding header

		this.writeHead(statusCode, {
			'Content-Encoding' : compressionMethod
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
