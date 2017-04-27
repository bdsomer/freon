const qs = require('querystring'),
cookie = require('cookie'),
url = require('url'),
userAgent = require('user-agent'),
acceptParse = require('../accept-parse');

module.exports = function(req, res, next) {

	// ---
	// Request Object Properties
	// ---

    // Set req.url to a parsed version of itself

    req.url = url.parse(req.url);

    // Convert all headers to camelCase
	// ex. 'x-requested-with' becomes 'xRequestedWith', 'cache-control' becomes 'cacheControl', etc.

	const camelCaseHeaders = { };

	// Loop through the entries of req.headers

	Object.entries(req.headers).forEach(([key, value]) => {

		// Split the dashes
		// ex. 'x-requested-with' becomes ['x', 'requested', 'with'], 'cache-control' becomes ['cache', 'control'], etc.

		const splitHeaders = key.split('-');

		// The start of the current header name is the first in the array, NOT CAPATALIZED
		// ex. 'x' in 'x-requested-with'

		var camelCaseHeader = splitHeaders[0];

		// Loop through the array

		for (let i = 1; i < splitHeaders.length; i++) {

			// Capatalize the first letter and add it on to the camelCaseHeader variable

			const currentWord = splitHeaders[i];
			camelCaseHeader += currentWord.charAt(0).toUpperCase() + currentWord.substring(1);
		}

		// Set the key (ex. 'xRequestedWith' or 'cacheControl') of the camelCaseHeaders to the value of the current header

		camelCaseHeaders[camelCaseHeader] = value;
	});

	// Set the req.headers object to the camelCase headers

	req.headers = camelCaseHeaders;

	// Set req.ip
	// First, check the xForwaredFor header

	const xForwardedFor = req.headers.xForwardedFor;

	if (xForwardedFor) { // Check the X-Forwareded-For header, this will reveal the *real* IP address if a non-IP-hiding, rule-abiding proxy is being used
		req.ip = xForwardedFor.split(', ')[0];
	} else {
		req.ip  = req.connection.remoteAddress;
	}

	// Set req.connectionIp
	// Useful for rate limiting, IP banning, etc. as it is much harder to spoof - and if spoofed, the client will normally not recieve a response

	req.connectionIp = req.connection.remoteAddress;

	// Set req.query to a parsed version of req.url.query

	req.query = qs.parse(req.url.query);

	// Set req.secure to true if HTTPS is being used

	req.secure = req.url.protocol === 'https';

	// Set req.cookies to a parsed version of req.headers.cookie, if a cookie exists. If a cookie doesn't exist, make it an empty object.

	req.cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : { };

	// Set req.userAgent to a parsed version of req.headers.userAgent, if it exists. If it doesn't exist, make it { full: '', name: '', version: '', fullName: '', os: '' }

	req.userAgent = req.headers.userAgent ? userAgent.parse(req.headers.userAgent) : {
		'full' : '',
		'name' : '',
		'version' : '',
		'fullName' : '',
		'os': ''
	};

	// Set req.headers.accept, req.headers.acceptEncoding, and req.headers.acceptLanguage to arrays

	req.acceptTypes = acceptParse(req.headers.accept);
	req.acceptEncodings = acceptParse(req.headers.acceptEncoding);
	req.acceptLanguages = acceptParse(req.headers.acceptLanguage);

	// Gather all the body data

	req.body = '';
	req.on('data', chunk => {
		req.body += chunk;
	});

	// ---
	// Request Object Methods
	// ---

	req.accepts = function(contentType) {

		// Loop through what the client accepts

		for (let i = 0; i < this.acceptTypes.length; i++) {

			// Check if it matches the content type passed in

			if (this.acceptTypes[i].indexOf(contentType) > -1 || contentType.search(new RegExp(this.acceptTypes[i].replace(/([.+?^=!:${}()|\[\]\/\\])/g, '\\$1').replace(/\*/g, '.+'))) === 0) return true;
		}

		// Return false if the acceptance was not found

		return false;
	};

	req.acceptsEncoding = function(encoding) {

		// Check if it is in the encoding array

		return this.acceptEncodings.indexOf(encoding) > -1;

	}

	req.acceptsLanguage = function(language) {

		// Check if it is in the language array

		return this.acceptLanguages.indexOf(language) > -1;
	}

	next();
};