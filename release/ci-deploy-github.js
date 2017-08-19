#!/usr/bin/env node

// create upcoming github release whenever a tag is pushed.
// will remove existing release if any, allowing us to
// force-push tags gone bad. this is only useful for cosmetic
// reasons (no weird version number skips)

const $ = require("./common");
const ospath = require("path");

async function ciDeployGithub() {
  $(await $.goDep("gothub", "github.com/itchio/gothub"));
  await $.showVersions(["gothub"]);

  const rawTags = await $.getOutput(
    "git for-each-ref --sort=taggerdate --format '%(refname) %(taggerdate)' refs/tags"
  );
  // refs/tags/v17.3.0-canary Sat May 7 15:46:38 2016 +0200
  // refs/tags/v17.3.0-canary
  // v17.3.0-canary
  const allTags = rawTags.split("\n").map(x => {
    const tokens = x.split(" ")[0].split("/");
    return tokens[tokens.length - 1];
  });

  let relevantTags;
  switch ($.channelName()) {
    case "canary":
      relevantTags = allTags.filter(function(x) {
        return /-canary$/.test(x);
      });
      break;
    case "stable":
      relevantTags = allTags.filter(function(x) {
        return /^[^-]+$/.test(x);
      });
      break;
    default:
      throw new Error(`Unknown channel: ${$.channelName()}`);
  }

  const previousTag = relevantTags[relevantTags.length - 2]; // last but one
  const buildTag = $.buildTag();
  $.say(`Creating changelog from ${previousTag} to ${buildTag}`);

  const rawlog = await $.getOutput(
    `git log --oneline --no-merges ${previousTag}..${buildTag}`
  );
  // 83c7b2f :bug: Fix menu links
  //   * :bug: Fix menu links
  const changelog = rawlog
    .split("\n")
    .filter(function(x) {
      return !/Translated using Weblate/.test(x);
    })
    .map(function(x) {
      return x.replace(/^\S+\s/g, "  * ");
    })
    .join("\n");
  $.say(`Changelog:\n${changelog}`);

  $.say("Deleting release if any...");
  if (!await $.gothub(`delete --tag ${buildTag}`)) {
    $.putln(`First build for ${buildTag}`);
  }

  $.say("Creating release...");
  $(
    await $.gothub(
      `release --tag ${buildTag} --draft --description "${changelog.replace(
        /`/g,
        "\\`"
      )}"`
    )
  );

  $.say("Uploading assets...");
  for (const name of await $.findAllFiles("packages")) {
    await $.retry(async function() {
      return await $.gothub(
        `upload --tag ${buildTag} --name ${ospath.basename(
          name
        )} --file ${name} --replace`
      );
    });
  }
}

ciDeployGithub();
