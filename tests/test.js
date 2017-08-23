const tl = require('testlite');

tl('Application', require('./applicationTest.js'));
tl('Should Compress Module', require('./shouldCompressTest.js'));
tl('Request Object', require('./requestObjectTest.js'));
tl('Request Object - Accept', require('./requestObjectAcceptTest.js'));
tl('Response Object', require('./responseObjectTest.js'));
tl('Static', require('./staticTest.js'));
tl.test();