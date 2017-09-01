/**
 * The default values and methods injected into the request object.
 */
class DefaultRequestPlugin {
	constructor() {
		/**
		 * The connection IP address. Shorthand of req.connection.remoteAddress.
		 * 
		 * @name DefaultRequestPlugin#connectionIp
		 * @type {String}
		 */

		/**
		 * The connection IP address, giving the X-Forwared-For header priority.
		 * 
		 * @name DefaultRequestPlugin#ip
		 * @type {String}
		 */

		 /**
		 * A parsed version of <code>req.url</code>.
		 * 
		 * @name DefaultRequestPlugin#url
		 * @type { { String : String } }
		 */

		/**
		 * A parsed version of <code>req.url.query</code>.
		 * 
		 * @name DefaultRequestPlugin#query
		 * @type { { String : Object } }
		 */

		/**
		 * A list of content types that the client accepts, most preffered first.
		 * 
		 * @name DefaultRequestPlugin#acceptTypes
		 * @type {String[]}
		 */

		/**
		 * A list of encodings that the client accepts, most preffered first.
		 * 
		 * @name DefaultRequestPlugin#acceptEncodings
		 * @type {String[]}
		 */

		/**
		 * A list of languages that the client accepts, most preffered first.
		 * 
		 * @name DefaultRequestPlugin#acceptLanguages
		 * @type {String[]}
		 */

		/**
		 * <code>true</code> if the protocol is HTTPS, <code>false</code> otherwise.
		 * 
		 * @name DefaultRequestPlugin#secure
		 * @type {Boolean}
		 */

		/**
		 * The request body. Only guarenteed to be filled when the <code>'end'</code> event is emitted.
		 * 
		 * @name DefaultRequestPlugin#body
		 * @type {Buffer}
		 */
	}

	/**
	 * Checks if a client accepts a specific content type.
	 * @param {String} contentType The type to check.
	 * @return {Boolean} <code>true</false> if the client does accept it, <code>false</code> otherwise.
	 */
	accepts(contentType) { }

	/**
	 * Checks if a client accepts a specific encoding.
	 * @param {String} encoding The encoding to check.
	 * @return {Boolean} <code>true</false> if the client does accept it, <code>false</code> otherwise.
	 */
	acceptsEncoding(encoding) { }

	/**
	 * Checks if a client accepts a specific language.
	 * @param {String} language The language to check.
	 * @return {Boolean} <code>true</false> if the client does accept it, <code>false</code> otherwise.
	 */
	acceptsLanguage(language) { }
}