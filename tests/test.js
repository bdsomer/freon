const tl = require('testlite');

tl('Application', require('./applicationTest'));
tl('Request Object', require('./requestObjectTest'));
tl('Request Object - Accept', require('./requestObjectAcceptTest'));
tl('Response Object', require('./responseObjectTest'));
tl('Camel Case Headers', require('./camelCaseHeadersTest'));
tl('Static', require('./staticTest'));
tl.test();