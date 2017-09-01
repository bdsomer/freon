/**
 * @typedef {Object} fileOptions
 * @property {Boolean=} [lastModified=true] When set to <code>true</code>, sends Last-Modified headers and 304 status codes, a.k.a. enabling caching.
 */

 /**
  * @typedef {Function} errCallback
  * @param {Error=} err The error, if one occured.
  */

/**
 * The default methods injected into the response object.
 */
class DefaultResponsePlugin {
	/**
	 * Redirects the client to a different page.
	 * @param {String} url The URL to redirect to.
	 * @param {Number=} [statusCode=302] The status code to send.
	 */
	redirect(url, statusCode) { }

	/**
	 * Automatically reads, compresses (if possible and benefitial), and sends data to the client, read from a file.
	 * @param {String} filePath The path to the file.
	 * @param {errCallback=} cb The callback that occurs when all is complete.
	 * @param {Number=} [statusCode=200] The status code to send.
	 * @param {fileOptions=} options Additional options.
	 */
	endFile(filePath, cb, statusCode, options) { }

	/**
	 * Sets a <code>Content-Disposition</code> header, causing the client to open a "Save File" dialog or download the file.
	 * @param {String=} contentPath The default name of the file to be downloaded.
	 */
	attachContent(contentPath) { }

	/**
	 * Automatically reads, compresses (if possible and benefitial), and sends data to the client, read from a file after setting a <code>Content-Disposition</code> header, causing the client to open a "Save File" dialog or download the file.
	 * @param {String} filePath The path to the file.
	 * @param {errCallback=} cb The callback that occurs when all is complete.
	 * @param {Number=} [statusCode=200] The status code to send.
	 * @param {fileOptions=} options Additional options.
	 */
	uploadFile(filePath, cb, statusCode, options) { }

	/**
	 * Sends the data or pipes the stream to the client, compressed.
	 * @param {String|Buffer|Stream} data The data to be sent.
	 * @param {String=} compressionMethod <code>gzip</code> or <code>deflate</code>. If nothing is passed, the client's most preferred compression method is used, or none if the client does not support <code>gzip</code> or <code>deflate</code>.
	 * @param {errCallback=} cb The callback that occurs when all is complete.
	 * @param {Number=} [statusCode=200] The status code to send.
	 */
	endCompressed(data, compressionMethod, cb, statusCode) { }
}