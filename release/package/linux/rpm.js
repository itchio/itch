const $ = require("../../common");
const base = require("./base");

module.exports = {
  packageRpm: async function(arch, buildPath) {
    // RPM package
    const rpmArch = $.toRpmArch(arch);
    $(await $.gemDep("fpm", "fpm"));

    $.say("Preparing stage2");
    const stage2Path = "rpm-stage";
    await base.prepareStage2(buildPath, stage2Path);

    const distroFiles = ".=/";

    $(
      await $.sh(`fpm --force \
      -C ${stage2Path} -s dir -t rpm \
      --rpm-compression xz \
      --name "${$.appName()}" \
      --description "${$.DESCRIPTION}" \
      --url "${$.HOMEPAGE}" \
      --version "${$.buildVersion()}" \
      --maintainer "${$.MAINTAINER}" \
      --architecture "${rpmArch}" \
      --license "MIT" \
      --vendor "itch.io" \
      --category "games" \
      --after-install "release/debian-after-install.sh" \
      -d "desktop-file-utils" \
      -d "libappindicator" \
      -d "libXScrnSaver" \
    ${distroFiles}
    `)
    );

    $(await $.sh("cp *.rpm packages/"));
  },
};
