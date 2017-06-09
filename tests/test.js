const tl = require('testlite');

tl('Application', require('./applicationTest'));
tl('Should Compress Module', require('./shouldCompressTest'));
tl('Camel Case Headers', require('./camelCaseHeadersTest'));
tl('Request Object', require('./requestObjectTest'));
tl('Request Object - Accept', require('./requestObjectAcceptTest'));
tl('Response Object', require('./responseObjectTest'));
tl('Static', require('./staticTest'));
tl.test();