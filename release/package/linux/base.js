const $ = require("../../common");

module.exports = {
  prepareStage2: async function(buildPath, stage2Path) {
    $(await $.sh(`rm -rf ${stage2Path}`));
    $(await $.sh(`mkdir -p ${stage2Path}`));

    $.say("Creating base directories");
    const baseDirs = [
      "/usr/bin",
      `/usr/lib/${$.appName()}`,
      "/usr/share/applications",
      "/usr/share/metainfo",
      `/usr/share/doc/${$.appName()}`,
      "/usr/share/man/man6",
    ];

    for (const path of baseDirs) {
      $(await $.sh(`mkdir -p "${stage2Path}${path}"`));
    }

    $.say("Copying binaries");
    $(
      await $.sh(`cp -rf ${buildPath}/* "${stage2Path}/usr/lib/${$.appName()}"`)
    );
    $(
      await $.sh(
        `ln -s "../lib/${$.appName()}/${$.appName()}" "${stage2Path}/usr/bin/${$.appName()}"`
      )
    );

    $.say("Copying icons");
    const iconSizes = ["16", "32", "48", "64", "128", "256", "512"];
    for (size of iconSizes) {
      const dir = `${stage2Path}/usr/share/icons/hicolor/${size}x${size}/apps`;
      $(await $.sh(`mkdir -p "${dir}"`));
      $(
        await $.sh(
          `cp "release/images/${$.appName()}-icons/icon${size}.png" "${dir}/${$.appName()}.png"`
        )
      );
    }

    $.say("Copying linux extras");
    $(
      await $.sh(
        `cp "linux-extras/io.itch.${$.appName()}.desktop" "${stage2Path}/usr/share/applications/io.itch.${$.appName()}.desktop"`
      )
    );
    $(
      await $.sh(
        `cp "linux-extras/${$.appName()}.6" "${stage2Path}/usr/share/man/man6/${$.appName()}.6"`
      )
    );
    $(
      await $.sh(
        `cp "linux-extras/${$.appName()}.appdata.xml" "${stage2Path}/usr/share/metainfo/${$.appName()}.appdata.xml"`
      )
    );
  },
};
