const fileDir = 'tests/files';

const assert = require('assert'),
static = require('../plugins/static')(fileDir),
fs = require('fs'),
zlib = require('zlib');

const createRequest = (pathname, encodings, headers) => {
	encodings = encodings || [ ];
	headers = headers || { };
	const acceptsEncoding = encoding => encodings.indexOf(encoding) > -1;
	return {
		'url' : {
			'pathname' : pathname
		}, headers, acceptsEncoding
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
}, request = (pathname, end, encodings, clientHeaders) => {
	var statusCode = 0;
	var headers = { };
	const writeHead = (_statusCode, _headers) => {
		statusCode = _statusCode;
		_headers = _headers || { };
		headers = Object.assign(_headers, headers);
	};
	const setHeader = (key, value) => headers[key] = value;
	const options = { writeHead, setHeader, 'end' : data => end(data, statusCode, headers) };
	static(createRequest(pathname, encodings, clientHeaders), options);
};

const cacheFilePath = '/someText.txt';

const checkCachingWithObject = (headerKey, headerValue) => {
	return new Promise((resolve, reject) => {
		request(cacheFilePath, (data, statusCode, headers) => {
			const obj = { };
			obj[headerKey] = headers[headerValue];
			request(cacheFilePath, (data, statusCode) => {
				try {
					assert.strictEqual(data, undefined);
					assert.strictEqual(statusCode, 304);
					resolve();
				} catch (err) {
					reject(err);
				}
			}, undefined, obj);
		});
	});
};

module.exports = {
	'static' : {
		'should return data when requested' : () => {
			return new Promise((resolve, reject) => {
				const pathname = '/index.html';
				request(pathname, data => {
					fileData(pathname).then(fileData => {
						try {
							assert.strictEqual(Buffer.compare(data, fileData), 0);
						} catch (err) {
							reject(err);
						}
						resolve();
					}, reject);
				});
			});
		}, 'should return an eTag consistently' : () => {
			return new Promise((resolve, reject) => {
				request(cacheFilePath, (data, statusCode, firstHeaders) => {
					request(cacheFilePath, (data, statusCode, secondHeaders) => {
						try {
							assert.strictEqual(firstHeaders.eTag, secondHeaders.eTag);
							resolve();
						} catch (err) {
							reject(err);
						}
					});
				});
			});
		}, 'should send a 304 when the correct eTag is served' : () => checkCachingWithObject('ifNoneMatch', 'eTag'),
		'should send a 304 when the correct last modified date is served' : () => checkCachingWithObject('ifModifiedSince', 'lastModified'),
		'should return the correct mime type' : () => {
			return new Promise((resolve, reject) => {
				request('/someText.txt', (data, statusCode, headers) => {
					try {
						assert.strictEqual(headers.contentType, 'text/plain');
						resolve();
					} catch (err) {
						reject(err);
					}
				});
			});
		}, 'should set the correct content-encoding header' : () => {
			return new Promise((resolve, reject) => {
				request('/subdir/subTest.txt', (data, statusCode, headers) => {
					try {
						assert.strictEqual(headers.contentEncoding, 'gzip');
						resolve();
					} catch (err) {
						reject(err);
					}
				}, ['gzip', 'deflate']);
			});
		}, 'should compress data when possible' : () => {
			return new Promise((resolve, reject) => {
				const pathName = '/subdir/subTest.txt';
				request(pathName, (data) => {
					fileData(pathName).then(fileData => {
						zlib.gzip(fileData, (err, gzipData) => {
							try {
								assert.strictEqual(Buffer.compare(data, gzipData), 0);
								resolve();
							} catch (err) {
								reject(err);
							}
						});
					}, reject);
				}, ['gzip', 'deflate']);
			});
		}
	}
};