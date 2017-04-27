const requestObject = require('../plugins/requestObject.js'),
assert = require('assert');

const request = {
	'connection' : {
		'remoteAddress': '127.0.0.1'
	}, 'on' : () => { },
	'url' : 'http://localhost/requestObjectTest',
	'headers' : {
		'accept' : 'text/html,text/plain;q=0.8,*/*;q=0',
		'accept-encoding' : 'gzip;q=1,deflate;q=0.5,someRandomMethod;q=0.0',
		'accept-language' : 'en-US;q=1.0,en;q=0.5,es;q=0'
	}, 'method' : 'GET'
},
sendTest = (req, res, next) => {
	req = req || Object.assign(request);
	next = next || function() {};
	const reqCopy = Object.assign({}, request);
	requestObject(reqCopy, res, next);
	return reqCopy;
};

module.exports = {
	'acceptTypes, acceptEncodings, acceptLanguages' : {
		'should return an array of accepted "things"' : () => {
			const req = sendTest();
			assert.strictEqual(req.acceptTypes[0], 'text/html');
			assert.strictEqual(req.acceptTypes[1], 'text/plain');
			assert.strictEqual(req.acceptEncodings[0], 'gzip');
			assert.strictEqual(req.acceptEncodings[1], 'deflate');
			assert.strictEqual(req.acceptLanguages[0], 'en-US');
			assert.strictEqual(req.acceptLanguages[1], 'en');
		}, 'should not have elements in the array that have qValues of 0' : () => {
			sendTest(req => {
				assert.notStrictEqual(req.acceptTypes[2], '*/*');
				assert.notStrictEqual(req.acceptEncodings[2], 'someRandomMethod');
				assert.notStrictEqual(req.acceptLanguages[2], 'es');
			});
		}
	}
};