#!/bin/bash
printf "typescript: "
wc -l $(find appsrcts -name '*.ts') | tail -1
printf "javascript: "
wc -l $(find appsrc -name '*.js') | tail -1
