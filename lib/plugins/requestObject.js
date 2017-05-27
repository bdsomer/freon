const qs = require('querystring'),
cookie = require('cookie'),
userAgent = require('user-agent'),
acceptParse = require('../accept-parse'),
camelCaseHeaders = require('../camelCaseHeaders');

module.exports = function(req, res, next) {

	// ---
	// Request Object Properties
	// ---

	// Set req.connectionIp
	// Useful for rate limiting, IP banning, etc. as it is much harder to spoof - and if spoofed, the client will normally not recieve a response

	req.connectionIp = req.connection.remoteAddress;
	
	// We will only parse cookies, headers, etc. when they requested, so initialize them when the `get` handler is called
	// Create a copy of the old headers to use in the header parsing function

	const oldHeaders = Object.assign({}, req.headers);

	Object.defineProperties(req, {
		'headers' : {
			get: function() {
				// Check if we have already parsed the headers!

				if (this.___headers) {
					// If so, return them

					return this.___headers;
				} else {
					// If not, parse them and then return them

					this.___headers = camelCaseHeaders.headerObjectToCamel(oldHeaders);

					// Return the parsed headers

					return this.___headers;
				}
			}
		}, 'ip' : {
			get: function() {
				if (this.___ip) {
					return this.___ip;
				} else {
					// First, check the xForwaredFor header

					const xForwardedFor = this.headers.xForwardedFor;

					if (xForwardedFor) { // Check the X-Forwareded-For header, this will reveal the *real* IP address if a non-IP-hiding, rule-abiding proxy is being used
						this.___ip = xForwardedFor.split(', ')[0];
					} else {
						this.___ip  = this.connectionIp;
					}

					// Return the computed IP address

					return this.___ip;
				}
			}
		}, 'query' : {
			get: function() {
				if (this.___query) {
					return this.___query;
				} else {
					// Parse the query string

					this.___query = req.query = qs.parse(req.url.query);
					return this.___query;
				}
			}
		}, 'cookies' : {
			get: function() {
				if (this.___cookies) {
					return this.___cookies;
				} else {
					// Set req.cookies to a parsed version of req.headers.cookie, if a cookie exists. If a cookie doesn't exist, make it an empty object

					this.___cookies = this.headers.cookie ? cookie.parse(req.headers.cookie) : { };

					// Return the parsed cookies

					return this.___cookies;
				}
			}
		}, 'userAgent' : {
			get: function() {
				if (this.___userAgent) {
					return this.___userAgent;
				} else {
					// Set req.userAgent to a parsed version of req.headers.userAgent, if it exists. If it doesn't exist, make it { full: '', name: '', version: '', fullName: '', os: '' }

					this.___userAgent = this.headers.userAgent ? userAgent.parse(this.headers.userAgent) : {
						'full' : '',
						'name' : '',
						'version' : '',
						'fullName' : '',
						'os': ''
					};

					// Return the parsed user agent header

					return this.___userAgent;
				}
			}
		}, 'acceptTypes' : {
			get: function() {
				if (this.___acceptTypes) {
					return this.___acceptTypes;
				} else {
					// Parse the accept header

					this.___acceptTypes = acceptParse(req.headers.accept);

					// Return the parsed header

					return this.___acceptTypes;
				}
			}
		}, 'acceptEncodings' : {
			get: function() {
				if (this.___acceptEncodings) {
					return this.___acceptEncodings;
				} else {
					// Parse the accept header

					this.___acceptEncodings = acceptParse(req.headers.acceptEncoding);

					// Return the parsed header

					return this.___acceptEncodings;
				}
			}
		}, 'acceptLanguages' : {
			get: function() {
				if (this.___acceptLanguages) {
					return this.___acceptLanguages;
				} else {
					// Parse the accept header

					this.___acceptLanguages = acceptParse(req.headers.acceptLanguage);

					// Return the parsed header

					return this.___acceptLanguages;
				}
			}
		}
	});

	// Set req.secure to true if HTTPS is being used

	req.secure = req.url.protocol === 'https';

	// Gather all the body data

	req.body = new Buffer([]);
	req.on('data', chunk => {
		req.body = Buffer.concat([req.body, chunk]);
	});

	// ---
	// Request Object Methods
	// ---

	req.accepts = function(contentType) {

		// Loop through what the client accepts

		for (let i = 0; i < this.acceptTypes.length; i++) {

			// Check if it matches the content type passed in

			if (this.acceptTypes[i].indexOf(contentType) > -1 || contentType.search(new RegExp(this.acceptTypes[i].replace(/([.+?^=!:${}()|\[\]\/\\])/g, '\\$1').replace(/\*/g, '.+?'))) === 0) return true;
		}

		// Return false if the acceptance was not found

		return false;
	};

	req.acceptsEncoding = function(encoding) {

		// Check if it is in the encoding array

		return this.acceptEncodings.indexOf(encoding) > -1;

	};

	req.acceptsLanguage = function(language) {

		// Check if it is in the language array

		return this.acceptLanguages.indexOf(language) > -1;
	};

	next();
};