const assert = require('assert'),
url = require('url'),
qs = require('querystring'),
cookie = require('cookie'),
userAgent = require('user-agent'),
requestObject = require('../plugins/requestObject');

const testUrl = 'http://localhost',
test = (request, property, expectedValue, deepEqual) => {
	return () => {
		const on404 = () => {
			throw new Error('404 should not be written.');
		};
		request = Object.assign({
			'connection' : {
				'remoteAddress' : '127.0.0.1'
			},
			'on' : () => { },
			'url' : testUrl,
			'writeHead' : on404,
			'end' : on404,
			'headers' : { }
		}, request);
		requestObject(request, { }, function() {});
		if (deepEqual) {
			assert.deepEqual(request[property], expectedValue);
		} else {
			assert.strictEqual(request[property], expectedValue);
		}
	};
};

const testUrlParsed = url.parse(testUrl),
queryParsed = qs.parse(testUrlParsed.query),
userAgentFull = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36',
userAgentParsed = userAgent.parse(userAgentFull);

module.exports = {
	'url' : {
		'should be parsed' : test({
			'url' : testUrl
		}, 'url', testUrlParsed, true)
	}, 'cookies' : {
		'should be parsed' : test({
			'headers' : {
				'cookie' : [cookie.serialize('foo', 'bar'), cookie.serialize('key', 'val')].join(';')
			}
		}, 'cookies', {
			'foo' : 'bar',
			'key' : 'val'
		}, true)
	}, 'ip' : {
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
	}, 'userAgent' : {
		'should be parsed' : test({
			'headers' : {
				'user-agent' : userAgentFull
			}
		}, 'userAgent', userAgentParsed, true)
	}
};