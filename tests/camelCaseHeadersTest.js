const camelCaseHeaders = require('../camelCaseHeaders'),
assert = require('assert');

module.exports = {
	'headerStringToCamel' : {
		'should convert an HTTP header key to a camelCase format' : () => {
			assert.strictEqual(camelCaseHeaders.headerStringToCamel('some-random-header'), 'someRandomHeader');
		}, 'should convert ETag to eTag': () => {
			assert.strictEqual(camelCaseHeaders.headerStringToCamel('ETag'), 'eTag');
		}
	}, 'headerObjectToCamel' : {
		'should convert an object with HTTP header keys to an object with camelCase keys' : () => {
			assert.deepStrictEqual(camelCaseHeaders.headerObjectToCamel({
				'x-requested-with' : 'test',
				'some-other-header' : 'anotherTest'
			}), {
				'xRequestedWith' : 'test',
				'someOtherHeader' : 'anotherTest' 
			});
		}
	}, 'camelStringToHeader' : {
		'should convert a camelCase formatted header keys into an HTTP formatted header key' : () => {
			assert.strictEqual(camelCaseHeaders.camelStringToHeader('accessControlAllowOrigin'), 'Access-Control-Allow-Origin');
		}, 'should convert eTag to ETag': () => {
			assert.strictEqual(camelCaseHeaders.camelStringToHeader('eTag'), 'ETag');
		}
	}, 'camelObjectToHeader' : {
		'should convert an object with camelCase formatted header keys into an object with HTTP formatted header keys' : () => {
			assert.deepStrictEqual(camelCaseHeaders.camelObjectToHeader({
				'xRequestedWith' : 'test',
				'someOtherHeader' : 'anotherTest',
				'contentType' : 'text/plain'
			}), {
				'X-Requested-With' : 'test',
				'Some-Other-Header' : 'anotherTest',
				'Content-Type' : 'text/plain'
			});
		}
	}
};