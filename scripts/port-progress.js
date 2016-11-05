#!/usr/bin/env node

let childProcess = require('child_process');

const ts = +String(childProcess.execSync("wc -l $(find appsrcts -name '*.ts') | tail -1")).replace("total", "").trim();
const js = +String(childProcess.execSync("wc -l $(find appsrc -name '*.js') | tail -1")).replace("total", "").trim();
const total = ts + js;

console.log(`typescript: ${ts} lines`)
console.log(`javascript: ${js} lines`)
console.log(`port ${((ts / total) * 100.0).toFixed(2)}% completed`)
