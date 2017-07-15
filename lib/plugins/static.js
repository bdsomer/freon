// Require statements
const path = require('path');

const serveDir = (dir, req, res, next) => {

	// Only serve GET requests

	if (req.method === 'GET') {
		
		// Replace all ../s to prevent exploits

		var pathname = req.url.pathname.replace(/\.\.\//g, '');

		// '/' = index.html

		if (pathname === '/') {
			pathname = 'index.html';
		}
		const filePath = path.join(dir, pathname);

		// End with the file

		res.endFile(filePath, (err) => {
			if (err) {

				// Call the next handler on error
				
				next();
			}
		}, null, null);
	} else {
		next();
	}
};

// Make a plugin-style functiont that simply calls serveDir

module.exports = dir => {
	return (req, res, next) => {
		serveDir(dir, req, res, next);
	};
};