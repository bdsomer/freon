// Load the cache with HTTP headers as the key and camel case headers as the value in

const fs = require('fs');
const headerToCamelCache = JSON.parse(fs.readFileSync('lib/headersToCamelCase.json').toString());

// Load the cache with camel case headers as the key and HTP headers as the value in

const camelToHeaderCache = JSON.parse(fs.readFileSync('lib/camelCaseToHeaders.json').toString());

/**
 * Parses an object using the specified parse function
 * @param {function} parseFunction the parsing function to use
 * @param {object} object the object to parse
 */
const parseObject = (parseFunction, object) => {

	// Map the object's keys

	const objectKeys = Object.keys(object);
	const newObjectKeys = Object.keys(object).map(parseFunction);

	// Create a new object with the values

	const toReturn = { };
	for (let i = 0; i < newObjectKeys.length; i++) {
		toReturn[newObjectKeys[i]] = object[objectKeys[i]];
	}

	return toReturn;
};

module.exports = {
	/**
	 * Converts the object's HTTP header keys keys to `camelCase`
	 * @param {Object.<string, string>} object the object to convert
	 * @return {Object.<string, string>} the converted object
	 */
	'headerObjectToCamel': object => parseObject(module.exports.headerStringToCamel, object),
	/**
	 * Converts the passed in HTTP header key string to `camelCase`
	 * @param {string} object the object to convert to a string
	 * @return {string} the converted string
	 */
	'headerStringToCamel': string => {

		// Check the cache for the passed in string

		const cachedCamelCaseHeader = headerToCamelCache[string];
		if (cachedCamelCaseHeader) {
			
			// Return the cached header if it is present

			return cachedCamelCaseHeader;
		}

		// If the header is not cached, parse it

		// Split the dashes
		// ex. 'x-requested-with' becomes ['x', 'requested', 'with'], 'cache-control' becomes ['cache', 'control'], etc.

		const splitHeaders = string.split('-');

		// The start of the current header name is the first in the array, NOT CAPATALIZED
		// ex. 'x' in 'x-requested-with'

		var camelCaseHeader = splitHeaders[0];

		// Loop through the array

		for (let i = 1; i < splitHeaders.length; i++) {

			// Capatalize the first letter and add it on to the camelCaseHeader variable

			const currentWord = splitHeaders[i];
			camelCaseHeader += currentWord.charAt(0).toUpperCase() + currentWord.substring(1);
		}

		return camelCaseHeader;
	},
	/**
	 * Converts the object's `camelCase` header keys keys to HTTP formatted keys
	 * @param {Object.<string, string>} object the object to convert
	 * @return {Object.<string, string>} the converted object
	 */
	'camelObjectToHeader': object => parseObject(module.exports.camelStringToHeader, object),
	/** Converts the passed in HTTP header key string to `camelCase`
	 * @param {string} object the object to convert to a string
	 * @return {string} the converted string
	 */
	'camelStringToHeader': string => {

		// Check the cache for the passed in string

		const cachedHttpHeader = camelToHeaderCache[string];
		if (cachedHttpHeader) {
			
			// Return the cached header if it is present

			return cachedHttpHeader;
		}

		// If the header is not cached, parse it

		// Loop through the string and create an array of strings (ex. 'xRequestedWith' gets converted to ['x', 'requested', 'with'])

		const stringChars = string.split("");

		/**
		 * The final header, to be returned.
		 */
		var header = stringChars[0].toUpperCase();

		 for (let i = 1; i < stringChars.length; i++) {
			 
			 // Check if the current char is uppercase, if so, add a '-' and the current letter

			 if (stringChars[i].toUpperCase() === stringChars[i]) {
				header += '-' + stringChars[i];
			 } else {

				// If not, then just add the letter

				header += stringChars[i];

			 }
		 }

		 return header;
	}
};