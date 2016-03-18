#!/bin/bash -xe
onchange 'appsrc/**/*.js' 'testsrc/**/*.js' 'appsrc/**/*.scss' -- grunt
