const qs = require('querystring'),
acceptParse = require('../accept-parse.js');

module.exports = function(req, res, next) {

	// Set req.connectionIp
	// Useful for rate limiting, IP banning, etc. as it is much harder to spoof - and if spoofed, the client will normally not recieve a response

	req.connectionIp = req.connection.remoteAddress;
	
	// We will only parse urls, headers, etc. when they requested, so initialize them when the `get` handler is called
	// Create a copy of the old headers to use in the header parsing function

	const oldHeaders = Object.assign({}, req.headers);

	Object.defineProperties(req, {
		'ip' : {
			get: function() {
				if (this.___ip) {
					return this.___ip;
				} else {
					// First, check the xForwaredFor header

					const xForwardedFor = this.headers['x-forwarded-for'];

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
		}, 'acceptTypes' : {
			get: function() {
				if (this.___acceptTypes) {
					return this.___acceptTypes;
				} else {
					// Parse the accept header

					this.___acceptTypes = acceptParse(this.headers.accept);

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

					this.___acceptEncodings = acceptParse(this.headers['accept-encoding']);

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

					this.___acceptLanguages = acceptParse(this.headers['accept-language']);

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
		if (req.body.length > res.app.maxClientBytes) { // `x > undefined` always returns `false`, no need to check if req.app.maxClientBytes exists
			req.connection.destroy();
		}
	});

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