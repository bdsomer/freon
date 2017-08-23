const assert = require('assert'),
url = require('url'),
qs = require('querystring'),
requestObject = require('../lib/plugins/requestObject.js'),
EventEmitter = require('events').EventEmitter;

const testUrl = 'http://localhost',
maxClientBytes = 1000,
test = (request, property, expectedValue, deepStrictEqual, cb, destroy) => {
	return () => {
		const on404 = () => {
			throw new Error('404 should not be written.');
		};
		request = Object.assign(new EventEmitter(), {
			'connection' : {
				'remoteAddress' : '127.0.0.1',
				destroy
			},
			'url' : testUrl,
			'writeHead' : on404,
			'end' : on404,
			'headers' : { }
		}, request || { });
		requestObject(request, {
			'app' : { maxClientBytes }
		}, function() {});
		if (cb) {
			cb(request);
		} else {
			if (deepStrictEqual) {
				assert.deepStrictEqual(request[property], expectedValue);
			} else {
				assert.strictEqual(request[property], expectedValue);
			}
		}
	};
};

const testUrlParsed = url.parse(testUrl),
queryParsed = qs.parse(testUrlParsed.query);

var destroyedConnection = false;

module.exports = {
	'ip' : {
		'should give priority to the X-Forwarded-For header' : test({
			'headers' : {
				'x-forwarded-for' : '123.321.123.321, 46.98.24.77'
			}
		}, 'ip', '123.321.123.321'), 'should fall back to req.connection.remoteAddress when the X-Forwarded-For header is not present' : test({} ,'connectionIp', '127.0.0.1')
	}, 'connectionIp' : {
		'should use req.connection.remoteAddress when X-Forwarded-For header is present' : test({
			'headers' : {
				'x-forwarded-for' : '123.321.123.321, 46.98.24.77'
			}
		}, 'connectionIp', '127.0.0.1'),
		'should use req.connection.remoteAddress when X-Forwarded-For header is not present' : test({} ,'connectionIp', '127.0.0.1')
	}, 'query' : {
		'should be parsed' : test({
			'url' : testUrl
		}, 'query', queryParsed, true)
	}, 'secure' : {
		'should return false on HTTP' : test({}, 'secure', false)
	}, 'maxClientBytes' : {
		'should destroy the connection when nessesary' : test(null, null, null, null, (request) => {
			request.emit('data', new Buffer('t'.repeat(maxClientBytes)));
			assert.strictEqual(destroyedConnection, false);
			request.emit('data', new Buffer('abc'));
			assert.strictEqual(destroyedConnection, true);
		}, () => {
			destroyedConnection = true;
		})
	}
};