
var Benchmark = require("benchmark");
var moment = require("moment");
var suite = new Benchmark.Suite;

var input = "2014-02-28 22:30:21.923569";
var output;

suite
.add('momentjs', function () {
  output = moment(`${input} +0000`, "YYYY-MM-DD HH:mm:ss Z").toDate();
})
.add('typeorm', function () {
  const date = new Date(input);
  const correctedDate = new Date();
  correctedDate.setUTCFullYear(date.getFullYear(), date.getMonth(), date.getDate());
  correctedDate.setUTCHours(date.getHours(), date.getMinutes(), date.getSeconds(), 0);
  output = correctedDate;
})
.add('custom', function () {
  output = new Date(input + " +0");
  output.setMilliseconds(0);
})
// add listeners
.on('cycle', function(event) {
  console.log(String(event.target));
  if (output.getUTCHours() != 22) {
    throw new Error(`Expected 22 hours, got ${output.getUTCHours()}`);
  }
  if (output.getMilliseconds() != 0) {
    throw new Error(`Expected 0 ms, got ${output.getMilliseconds()}`);
  }
  output = null;
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));
})
// run async
.run({ 'async': true });
