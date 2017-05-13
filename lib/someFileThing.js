const fs = require('fs');/*,
cch = require('./camelCaseHeaders');

const arr = JSON.parse(fs.readFileSync('headerArray.json'));
const obj = { };

arr.forEach((element) => {
	const realElement = element.toLowerCase();
	obj[realElement] = cch.headerStringToCamel(realElement);
});

fs.writeFileSync('headers.json', JSON.stringify(obj, null, 4));*/

const htcc = JSON.parse(fs.readFileSync('headersToCamelCase.json'));
const obj = { };

Object.keys(htcc).forEach((element) => {
	obj[htcc[element]] = element;
});

fs.writeFileSync('camelCaseToHeaders.json', JSON.stringify(obj, null, '\t'));