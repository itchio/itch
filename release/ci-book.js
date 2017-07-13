#!/usr/bin/env node

// generate latest documentation for itch using gitbook
// and deploy it to google cloud storage.

const $ = require("./common");

async function main() {
  await $.showVersions(["npm", "node"]);
  $(await $.npmDep("gitbook", "gitbook-cli"));

  await $.cd("docs", async () => {
    $(await $.npm("install"));
    $(await $.sh("gitbook build"));
    $(await $.gcp(`_book/* gs://docs.itch.ovh/itch/${$.buildRefName()}`));
  });
}

main();
