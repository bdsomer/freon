// For an explination, see http://www.itworld.com/article/2693941/cloud-computing/why-it-doesn-t-make-sense-to-gzip-all-content-from-your-web-server.html
const path = require('path');

module.exports = (size, filePath) => {

	// Don't compress files with a size less than 2000

	var shouldCompress = size > 2000;

	if (shouldCompress && filePath) {

		// Don't compress images or PDFs

		const fileExt = path.extname(filePath);
		shouldCompress = !(fileExt === '.png' || fileExt === '.jpg' || fileExt === '.gif' || fileExt === '.tiff' || fileExt === '.tif' || fileExt === '.pdf');
	}

	return shouldCompress;
};