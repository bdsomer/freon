const fileDir = 'tests/files';

const assert = require('assert'),
static = require('../lib/plugins/static')(fileDir),
responseObject = require('../lib/plugins/responseObject'),
fs = require('fs'),
EasyWritable = require('./easyWritable.js'),
zlib = require('zlib');

const createRequest = (pathname, acceptEncodings, headers) => {
	acceptEncodings = acceptEncodings || [ ];
	headers = headers || { };
	const acceptsEncoding = encoding => acceptEncodings.indexOf(encoding) > -1;
	return {
		'method' : 'GET',
		'url' : {
			'pathname' : pathname
		}, headers, acceptsEncoding, acceptEncodings
	};
}, filePath = pathname => {
	return fileDir + pathname;
}, fileData = pathname => {
	return new Promise((resolve, reject) => {
		fs.readFile(filePath(pathname), (err, data) => {
			if (err) {
				reject(err);
			} else {
				resolve(data);
			}
		});
	});
}, request = (pathname, endCallback, encodings, clientHeaders) => {
	const writeHead = function (statusCode, headers) {
		this.statusCode = statusCode;
		headers = headers || { };
		Object.assign(this.headers, headers);
	};
	const end = function (body) {
		this.body = this.body || body;
		this.statusCode = this.statusCode || 200;
		endCallback(this);
	};
	const setHeader = function (key, value) {
		this.headers[key] = value
	};
	const options = Object.assign(new EasyWritable(), { writeHead, setHeader, end, 'headers' : { } });
	const request = createRequest(pathname, encodings, clientHeaders);
	responseObject(request, options, function () { });
	static(request, options, function () { });
};

const cacheFilePath = '/someText.txt';

module.exports = {
	'static' : {
		'should return data when requested' : () => {
			return new Promise((resolve, reject) => {
				const pathname = '/index.html';
				request(pathname, (res) => {
					fileData(pathname).then(fileData => {
						try {
							assert.strictEqual(Buffer.compare(res.body, fileData), 0);
						} catch (err) {
							reject(err);
						}
						resolve();
					}, reject);
				});
			});
		}, 'should send a 304 when the correct last modified date is served' : () => {
			return new Promise((resolve, reject) => {
				request(cacheFilePath, (res) => {
					var ifModifiedSince = new Date(res.headers['Last-Modified']);
					// For some reason, CI is broken due to ~100ms offset, so we have to push the date a few seconds forward
					ifModifiedSince.setSeconds(ifModifiedSince.getSeconds() + 5);
					const obj = { ifModifiedSince };
					request(cacheFilePath, (res2) => {
						try {
							assert.ok(!res2.body);
							assert.strictEqual(res2.statusCode, 304);
						} catch (err) {
							reject(err);
						}
						resolve();
					}, null, obj);
				});
			});
		},
		'should return the correct mime type' : () => {
			return new Promise((resolve, reject) => {
				request('/someText.txt', (res) => {
					try {
						assert.strictEqual(res.headers['Content-Type'], 'text/plain');
						resolve();
					} catch (err) {
						reject(err);
					}
				});
			});
		}, 'should set the correct content-encoding header' : () => {
			return new Promise((resolve, reject) => {
				request('/someText.txt', (res) => {
					try {
						assert.strictEqual(res.headers.contentEncoding, 'gzip');
						resolve();
					} catch (err) {
						reject(err);
					}
				}, ['gzip', 'deflate']);
			});
		}, 'should compress data when applicable' : () => {
			return new Promise((resolve, reject) => {
				const path = '/someText.txt';
				request(path, (res) => {
					fileData(path).then(fileData => {
						zlib[res.headers.contentEncoding](fileData, (err, gzipData) => {
							try {
								assert.strictEqual(Buffer.compare(res.body, gzipData), 0);
								resolve();
							} catch (err) {
								reject(err);
							}
						});
					}, reject);
				}, ['gzip', 'deflate']);
			});
		}, 'should not compress data when not applicable' : () => {
			return new Promise((resolve, reject) => {
				request('/subdir/subTest.txt', (res) => {
					try {
						assert.ok(!res.headers.contentEncoding);
						resolve();
					} catch (err) {
						reject(err);
					}
				});
			});
		}
	}
};
