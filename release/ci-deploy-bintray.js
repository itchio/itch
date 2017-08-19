#!/usr/bin/env node

// uploads .deb and .rpm files to bintray

const $ = require("./common");

async function deployBintray() {
  if ($.channelName() === "canary") {
    $.say("Skipping bintray deploy for canary versions");
    process.exit(0);
  }

  $.say("Deploying to Bintray!");
  await $.gemDep("dpl", "dpl");

  $(await $.sh("mkdir -p build"));

  var date = $.buildTime();
  const releaseDate = `${date.getUTCFullYear()}-${$.leftPad(
    "" + date.getUTCMonth(),
    2,
    "0"
  )}-${$.leftPad("" + date.getUTCDate(), 2, "0")}`;
  $.say(`Release date: ${releaseDate}`);

  const repos = ["rpm", "deb"];
  const arches = ["386", "amd64"];
  for (const repo of repos) {
    for (const arch of arches) {
      $.say(`Uploading ${arch} to ${repo} repo...`);

      const debArch = $.toDebArch(arch);
      const rpmArch = $.toRpmArch(arch);

      // auto-publish releases, it's too easy to forget flipping the switch otherwise
      const publish = true;

      let conf = await $.readFile(`release/templates/bintray.${repo}.json.in`);
      conf = conf.replace(/{{CI_APPNAME}}/g, $.appName());
      conf = conf.replace(/{{CI_VERSION}}/g, $.buildVersion());
      conf = conf.replace(/{{CI_RELEASE_DATE}}/g, releaseDate);
      conf = conf.replace(/{{CI_PUBLISH}}/g, "" + publish);
      conf = conf.replace(/{{DEB_ARCH}}/g, debArch);
      conf = conf.replace(/{{RPM_ARCH}}/g, rpmArch);
      await $.writeFile("build/bintray.json", conf);

      $(
        await $.qsh(
          `dpl --provider=bintray --file=build/bintray.json --user=fasterthanlime --key="${process
            .env.BINTRAY_TOKEN}"`
        )
      );
    }
  }
}

deployBintray();
