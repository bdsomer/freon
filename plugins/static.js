// Require statements
const path = require('path'),
fs = require('fs'),
zlib = require('zlib'),
crypto = require('crypto'),
mime = require('mime');

const serveDir = (dir, req, res, next) => {

	// Replace all ../s to prevent exploits

	var pathname = req.url.pathname.replace(/\.\.\//g, '');

	// '/' = index.html

	if (pathname === '/') {
		pathname = 'index.html';
	}
	const filePath = path.join(dir, pathname);

	fs.readFile(filePath, (err, data) => {

		// Check if the file exists

		if (err) {

			// It doesn't exist, go to the next plugins

			next();

		} else {
			
			// The file does exist, let's serve it
			// Create the function to serve the data

			const serveData = (err, newData) => {

				// Check for an error

				const internalError = () => {
					res.writeHead(500);
					res.end('500 - Internal server error');
				};

				if (err) {

					// There was an error compressing the data, serve a 500

					internalError();

				} else {

					// Get the date that the file was last modified

					fs.stat(filePath, (err, stats) => {
						if (err) {

							// There was an error getting the statistics of the file, serve a 500

							internalError();

						} else {

							/**
							 * The date that the file was last modified.
							 */
							const lastModified = stats.mtime;

							// No error occured, keep going
							// Create a hash to use for an ETag

							const eTag = crypto.createHash('sha256').update(newData).digest('hex');

							// Check if the eTag matches
							// Also check if the Last-Modified header is the same as this file

							if (req.headers.ifNoneMatch === eTag || lastModified <= req.headers.ifModifiedSince) {

								// If it does, write a 304

								res.writeHead(304);
								res.end();
							} else {
								// Otherwise, end the request with the data

								res.writeHead(200, {
									'contentType' : mime.lookup(filePath),
									eTag, lastModified
								});
								res.end(newData);
							}
						}
					});
				}
			}

			// Check what compression the client supports

			if (req.acceptsEncoding('gzip')) {
				res.setHeader('contentEncoding', 'gzip');
				zlib.gzip(data, serveData);
			} else if (req.acceptsEncoding('deflate')) {
				res.setHeader('contentEncoding', 'deflate');
				zlib.deflate(data, serveData);
			} else {

				// The client doesn't support compression call with raw data

				serveData(undefined, data);
			}
		}
	});
};

// Make a plugin-style functiont that simply calls serveDir

module.exports = dir => {
	return (req, res, next) => {
		serveDir(dir, req, res, next);
	};
};