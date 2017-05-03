const assert = require('assert'),
fs = require('fs'),
zlib = require('zlib'),
responseObject = require('../plugins/responseObject');

const notFoundPage = 'A not found page...',
notFoundPageHeaders = {
	'Access-Control-Allow-Origin' : '*'
},
app = { notFoundPage, notFoundPageHeaders },
test = (callback, endCallback, encodings) => {
	encodings = encodings || [ ];
	var headers = { };
	var statusCode = 0;
	const writeHead = (_statusCode, _headers) => {
		statusCode = _statusCode;
		Object.assign(headers, _headers);
	};
	const setHeader = (key, value) => {
		headers[key] = value;	
	};
	const end = function (body) {
		this.body = body;
		this.headers = headers;
		this.statusCode = statusCode;
		endCallback(this);
	};
	const acceptsEncoding = (encoding) => encodings.indexOf(encoding) > -1;
	return () => {
		const req = { acceptsEncoding };
		const res = { app, writeHead, end, setHeader };
		responseObject(req, res, function() { });
		callback(res);
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
		'should be an object' : test((res) => {
			assert.ok(typeof res.cookies === 'object', 'typeof res.cookies !== \'object\'');
		})
	}, 'app' : {
		'should be the app that is handling this request' : test((res) => {
			assert.deepEqual(res.app, app);
		})
	}, 'addCookie()' : {
		'should modify the cookies opject property' : test((res) => {
			const cookieName = 'foo';
			const cookieValue = 'bar';
			const cookieOptions = {
				'httpOnly' : true
			};
			res.addCookie(cookieName, cookieValue, cookieOptions);
			testForCookie(res, 'foo', 'bar', cookieOptions);
		})
	}, 'addCookies()' : {
		'should modify the cookies object properly' : test((res) => {
			res.addCookies({
				'name' : 'asdf',
				'value' : 'fdsa'
			}, {
				'name' : 'test',
				'value' : 'tset'
			});
			testForCookie(res, 'asdf', 'fdsa');
			testForCookie(res, 'test', 'tset');
		})
	}, 'removeCookie()' : {
		'should stop a cookie from being sent' : test((res) => {
			const cookieName = '123';
			const cookieValue = '321';
			res.addCookie(cookieName, cookieValue);
			res.removeCookie(cookieName);
			assert.strictEqual(res.cookies[cookieName], undefined);
		})
	}, 'removeCookies()' : {
		'should stop multiple cookies from being sent' : test((res) => {
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
		})
	}, 'deleteCookie()' : {
		'should create an expired cookie' : test((res) => {
			const cookieValue = 'someCookieValue';
			res.deleteCookie(cookieValue);
			testForCookie(res, cookieValue, '', {
				'expires' : new Date(0)
			});
		})
	}, 'deleteCookies()' : {
		'should create multiple expired cookies' : test((res) => {
			const cookieValues = ['anotherCookieValue', 'asjdfi2037b*(&)B@0d0s(B@)(@B)@(B'];
			res.deleteCookies(...cookieValues);
			for (let i = 0; i < cookieValues.length; i++) {
				testForCookie(res, cookieValues[i], '', {
					'expires' : new Date(0)
				});
			}
		})
	}, 'redirect()' : {
		'should send a 302 status code if not specified' : test((res) => {
			res.redirect('https://example.com');
		}, (res) => {
			assert.strictEqual(res.statusCode, 302);
		}), 'should send a different status code if specified' : test((res) => {
			res.redirect('https://example.com', 12345);
		}, (res) => {
			assert.strictEqual(res.statusCode, 12345);
		}), 'should send a blank body' : test((res) => {
			res.redirect('https://example.com');
		}, (res) => {
			assert.strictEqual(res.body, undefined);
		})
	}, 'send404()' : {
		'should send 404 as the status code' : test((res) => {
			res.send404();
		}, (res) => {
			assert.strictEqual(res.statusCode, 404);
		}), 'should send the correct not found page' : test((res) => {
			res.send404();
		}, (res) => {
			assert.strictEqual(res.body, notFoundPage);
		})
	}, 'endFile()' : {
		'should send the file data' : test((res) => {
			res.endFile(testFilePath);
		}, (res) => {
			assert.strictEqual(Buffer.compare(res.body, testFileData), 0);
		}), 'should send a 200 status code' : test((res) => {
			res.endFile(testFilePath);
		}, (res) => {
			assert.strictEqual(res.statusCode, 200, 'non-200 status code');
		}), 'should send the correct content-type header' : test((res) => {
			res.endFile(testFilePath);
		}, (res) => {
			assert.deepStrictEqual(res.headers.contentType, 'text/plain');
		}), 'should send the correct last-modified header' : test((res) => {
			res.endFile(testFilePath);
		}, (res) => {
			assert.deepStrictEqual(res.headers.lastModified, testFileLastModified);
		}), 'should compress the file data when available' : test((res) => {
			res.endFile(testFilePath);
		}, (res) => {
			assert.strictEqual(Buffer.compare(res.body, testFileGzipped), 0);
		}, ['gzip', 'deflate']), 'should use the correct status code' : test((res) => {
			res.endFile(testFilePath, () => { }, 404);
		}, (res) => {
			assert.strictEqual(res.statusCode, 404);
		})
	}, 'attachContent()' : {
		'should set to attachment when nothing passed in' : test((res) => {
			res.attachContent();
			res.end();
		}, (res) => {
			assert.strictEqual(res.headers['Content-Disposition'], 'attachment');
		}), 'should add the filename paramater if contentPath is passed in' : test((res) => {
			res.attachContent('/some/path/with/a/file.html');
			res.end();
		}, (res) => {
			assert.strictEqual(res.headers['Content-Disposition'], 'attachment; filename="file.html"');
		}), 'should set the content-type if contentPath is passed in' : test((res) => {
			res.attachContent('/some/path/with/a/file.html');
			res.end();
		}, (res) => {
			assert.strictEqual(res.headers['Content-Type'], 'text/html');
		})
	}, 'endCompressed()' : {
		'should gzip data when asked' : test((res) => {
			res.endCompressed(testFileData, 'gzip');
		}, (res) => {
			assert.strictEqual(Buffer.compare(res.body, testFileGzipped), 0);
		}), 'should deflate data when asked' : test((res) => {
			res.endCompressed(testFileData, 'deflate');
		}, (res) => {
			assert.strictEqual(Buffer.compare(res.body, testFileDeflated), 0);
		}), 'should use the specified status code' : test((res) => {
			res.endCompressed(testFileData, 'gzip', () => { }, 404);
		}, (res) => {
			assert.strictEqual(res.statusCode, 404);
		})
	}
};