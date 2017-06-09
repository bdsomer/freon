const shouldCompress = require('../lib/shouldCompress.js'),
assert = require('assert');

module.exports = {
	'exports' : {
		'should only compress files over 2 KB' : () => {
			assert.ok(!shouldCompress(2), 'compressing data under 2 KB returns true');
			assert.ok(!shouldCompress(2000), 'compressing 2 KB data returns true');
			assert.ok(shouldCompress(2001), 'compressing data over 2 KB returns false');
		}, 'should not compress image files' : () => {
			assert.ok(!shouldCompress(4000, 'a.png'), 'PNG files return true');
			assert.ok(!shouldCompress(4000, 'a.jpg'), 'JPG files return true');
			assert.ok(!shouldCompress(4000, 'a.gif'), 'GIF files return true');
			assert.ok(!shouldCompress(4000, 'a.tiff'), 'TIFF files return true');
			assert.ok(!shouldCompress(4000, 'a.tif'), 'TIF files return true');
		}, 'should not compress PDF files' : () => {
			assert.ok(!shouldCompress(4000, 'a.pdf'), 'PDF files return true');
		}
	}
};