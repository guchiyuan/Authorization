require('babel-register');
require("babel-core").transform("code");
require("babel-polyfill");
require('./bin/www')
