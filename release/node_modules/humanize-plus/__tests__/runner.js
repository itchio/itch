/* eslint-disable */

require('babel-core/register');

var Jasmine = require('jasmine');
var jasmine = new Jasmine();

jasmine.loadConfig({
  spec_dir: '__tests__',
  spec_files: [
    '**/*.spec.js'
  ],
  stopSpecOnExpectationFailure: true
});

jasmine.execute();
