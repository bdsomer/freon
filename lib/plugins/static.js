// Require statements
const path = require('path'),
fs = require('fs'),
shouldCompress = require('../shouldCompress'),
mime = require('mime');

const serveDir = (dir, req, res, next) => {

	// Replace all ../s to prevent exploits

	var pathname = req.url.pathname.replace(/\.\.\//g, '');

	// '/' = index.html

	if (pathname === '/') {
		pathname = 'index.html';
	}
	const filePath = path.join(dir, pathname);

	// Get the file size. We don't want to compress files < 2000 bytes

	fs.stat(filePath, (err, stats) => {
		if (err) {

			// There was an error getting the statistics of the file or the file does not exist, go to the next plugin

			next();

		} else {

			// Check if the Last-Modified header is the same as this file

			/**
			 * The date that the file was last modified.
			 */
			const lastModifiedDate = new Date(stats.mtime);

			console.log('lmd', lastModifiedDate);

			/**
			 * The date the file was last modified, as a string.
			 */
			const lastModified = lastModifiedDate.toString();

			console.log('lm', lastModified);

			console.log('he', req.headers);
			console.log('dhe', new Date(req.headers.ifModifiedSince));
			console.log('bmot', lastModifiedDate <= new Date(req.headers.ifModifiedSince));

			if (lastModifiedDate <= new Date(req.headers.ifModifiedSince)) {

				// If it does, write a 304

				res.writeHead(304, { lastModified });
				res.end();
			} else {

				// The client does not have the cached data, serve the file

				// Create the read stream

				const readStream = fs.createReadStream(filePath);

				// Start compressing, if desired

				res.setHeader('lastModified', lastModified);
				res.setHeader('contentType', mime.lookup(filePath));

				if (shouldCompress(stats.size, filePath)) {
					res.endCompressed(readStream);
				} else {
					readStream.pipe(res);
				}
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