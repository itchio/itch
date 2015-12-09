#!/usr/bin/env node

var path = require('path');
var glob = require('glob');
require('nodent')();

process.argv.slice(2).forEach(function (arg) {
    glob(arg, function (err, files) {
        files.forEach(function (file) {
            var test = path.resolve(process.cwd(), file);
            console.log("> " + test);
            require(test);
        });
    });
});

// vim: ft=javascript
