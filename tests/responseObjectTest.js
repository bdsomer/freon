const assert = require('assert'),
fs = require('fs'),
zlib = require('zlib'),
EasyWritable = require('./easyWritable.js'),
responseObject = require('../lib/plugins/responseObject');

const notFoundPage = 'A not found page...',
notFoundPageHeaders = {
	'Access-Control-Allow-Origin' : '*'
},
app = { notFoundPage, notFoundPageHeaders },
test = (callback, endCallback, acceptEncodings) => {
	return () => {
		return new Promise((resolve, reject) => {
			acceptEncodings = acceptEncodings || [ ];
			const writeHead = function (statusCode, headers) {
				this.statusCode = statusCode;
				Object.assign(this.headers, headers);
			};
			const setHeader = function (key, value) {
				this.headers[key] = value;
			};
			const end = function (body) {
				this.body = this.body || body;
				this.statusCode = this.statusCode || 200;
				endCallback(this, resolve, reject);
			};
			const acceptsEncoding = (encoding) => acceptEncodings.indexOf(encoding) > -1;
			const req = { 'headers': { }, acceptsEncoding, acceptEncodings };
			const res = Object.assign(new EasyWritable(), { app, writeHead, end, setHeader, 'headers' : { } });
			responseObject(req, res, function() { });
			callback(res, resolve, reject);
		});
	};
};

const testForCookie = (res, cookieName, cookieValue, cookieOptions) => {
	const testCookieObject = { };
	testCookieObject[cookieName] = {
		'value' : cookieValue,
		'options' : cookieOptions
	};
	assert.deepEqual(res.cookies[cookieName], testCookieObject[cookieName]);
};

const testFilePath = 'tests/files/someText.txt';
const testFileData = fs.readFileSync(testFilePath);
const testFileLastModified = fs.statSync(testFilePath).mtime;
const testFileGzipped = zlib.gzipSync(testFileData);
const testFileDeflated = zlib.deflateSync(testFileData);

module.exports = {
	'cookies' : {
		'should be an object' : test((res, resolve) => {
			assert.ok(typeof res.cookies === 'object', 'typeof res.cookies !== \'object\'');
			resolve();
		})
	}, 'app' : {
		'should be the app that is handling this request' : test((res, resolve) => {
			assert.deepEqual(res.app, app);
			resolve();
		})
	}, 'addCookie()' : {
		'should modify the cookies opject property' : test((res, resolve) => {
			const cookieName = 'foo';
			const cookieValue = 'bar';
			const cookieOptions = {
				'httpOnly' : true
			};
			res.addCookie(cookieName, cookieValue, cookieOptions);
			testForCookie(res, 'foo', 'bar', cookieOptions);
			resolve();
		})
	}, 'addCookies()' : {
		'should modify the cookies object properly' : test((res, resolve) => {
			res.addCookies({
				'name' : 'asdf',
				'value' : 'fdsa'
			}, {
				'name' : 'test',
				'value' : 'tset'
			});
			testForCookie(res, 'asdf', 'fdsa');
			testForCookie(res, 'test', 'tset');
			resolve();
		})
	}, 'removeCookie()' : {
		'should stop a cookie from being sent' : test((res, resolve) => {
			const cookieName = '123';
			const cookieValue = '321';
			res.addCookie(cookieName, cookieValue);
			res.removeCookie(cookieName);
			assert.strictEqual(res.cookies[cookieName], undefined);
			resolve();
		})
	}, 'removeCookies()' : {
		'should stop multiple cookies from being sent' : test((res, resolve) => {
			res.addCookies({
				'name' : '456',
				'value' : '654'
			}, {
				'name' : '789',
				'value' : '987'
			});
			res.removeCookies('456', '789');
			assert.strictEqual(res.cookies['456'], undefined);
			assert.strictEqual(res.cookies['789'], undefined);
			resolve();
		})
	}, 'deleteCookie()' : {
		'should create an expired cookie' : test((res, resolve) => {
			const cookieValue = 'someCookieValue';
			res.deleteCookie(cookieValue);
			testForCookie(res, cookieValue, '', {
				'expires' : new Date(0)
			});
			resolve();
		})
	}, 'deleteCookies()' : {
		'should create multiple expired cookies' : test((res, resolve) => {
			const cookieValues = ['anotherCookieValue', 'asjdfi2037b*(&)B@0d0s(B@)(@B)@(B'];
			res.deleteCookies(...cookieValues);
			for (let i = 0; i < cookieValues.length; i++) {
				testForCookie(res, cookieValues[i], '', {
					'expires' : new Date(0)
				});
			}
			resolve();
		})
	}, 'redirect()' : {
		'should send a 302 status code if not specified' : test((res) => {
			res.redirect('https://example.com');
		}, (res, resolve) => {
			assert.strictEqual(res.statusCode, 302);
			resolve();
		}), 'should send a different status code if specified' : test((res) => {
			res.redirect('https://example.com', 12345);
		}, (res, resolve) => {
			assert.strictEqual(res.statusCode, 12345);
			resolve();
		}), 'should send a blank body' : test((res) => {
			res.redirect('https://example.com');
		}, (res, resolve) => {
			assert.strictEqual(res.body, undefined);
			resolve();
		}), 'should set the content type header to "text/plain"' : test((res) => {
			res.redirect('https://example.com');
		}, (res, resolve) => {
			assert.strictEqual(res.headers.contentType, 'text/plain');
			resolve();
		})
	}, 'endFile()' : {
		'should send the file data' : test((res) => {
			res.endFile(testFilePath);
		}, (res, resolve, reject) => {
			try {
				assert.strictEqual(Buffer.compare(res.body, testFileData), 0);
				resolve();
			} catch (err) {
				reject(err);
			}
		}), 'should send a 200 status code' : test((res) => {
			res.endFile(testFilePath);
		}, (res, resolve, reject) => {
			try {
				assert.strictEqual(res.statusCode, 200, 'non-200 status code');
				resolve();
			} catch (err) {
				reject(err);
			}
		}), 'should send the correct content-type header' : test((res) => {
			res.endFile(testFilePath);
		}, (res, resolve, reject) => {
			try {
				assert.deepStrictEqual(res.headers['Content-Type'], 'text/plain');
				resolve();
			} catch (err) {
				reject(err);
			}
		}), 'should send the correct last-modified header' : test((res) => {
			res.endFile(testFilePath);
		}, (res, resolve, reject) => {
			try {
				assert.deepStrictEqual(res.headers['Last-Modified'], testFileLastModified.toString());
				resolve();
			} catch (err) {
				reject(err);
			}
		}), 'should compress the file data when applicable' : test((res) => {
			res.endFile(testFilePath);
		}, (res, resolve, reject) => {
			try {
				assert.strictEqual(Buffer.compare(res.body, testFileGzipped), 0);
				resolve();
			} catch (err) {
				reject(err);
			}
		}, ['gzip', 'deflate']), 'should use the correct status code' : test((res) => {
			res.endFile(testFilePath, () => { }, 404);
		}, (res, resolve, reject) => {
			try {
				assert.strictEqual(res.statusCode, 404);
				resolve();
			} catch (err) {
				reject(err);
			}
		}), 'should not send last-modified header if disabled' : test((res) => {
			res.endFile(testFilePath, null, null, {
				'lastModified' : false
			});
		}, (res, resolve, reject) => {
			try {
				assert.strictEqual(res.headers['Last-Modified'], undefined);
				resolve();
			} catch (err) {
				reject(err);
			}
		})
	}, 'attachContent()' : {
		'should set to attachment when nothing passed in' : test((res) => {
			res.attachContent();
			res.end();
		}, (res, resolve) => {
			assert.strictEqual(res.headers['Content-Disposition'], 'attachment');
			resolve();
		}), 'should add the filename paramater if contentPath is passed in' : test((res) => {
			res.attachContent('/some/path/with/a/file.html');
			res.end();
		}, (res, resolve) => {
			assert.strictEqual(res.headers['Content-Disposition'], 'attachment; filename="file.html"');
			resolve();
		}), 'should set the content-type if contentPath is passed in' : test((res) => {
			res.attachContent('/some/path/with/a/fi2le.html');
			res.end();
		}, (res, resolve) => {
			assert.strictEqual(res.headers['Content-Type'], 'text/html');
			resolve();
		})
	}, 'endCompressed()' : {
		'should gzip data when asked' : test((res) => {
			res.endCompressed(testFileData, 'gzip');
		}, (res, resolve) => {
			assert.strictEqual(Buffer.compare(res.body, testFileGzipped), 0);
			resolve();
		}), 'should deflate data when asked' : test((res) => {
			res.endCompressed(testFileData, 'deflate');
		}, (res, resolve) => {
			assert.strictEqual(Buffer.compare(res.body, testFileDeflated), 0);
			resolve();
		}), 'should use the specified status code' : test((res) => {
			res.endCompressed(testFileData, 'gzip', () => { }, 404);
		}, (res, resolve) => {
			assert.strictEqual(res.statusCode, 404);
			resolve();
		})
	}
};