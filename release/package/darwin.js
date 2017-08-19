const $ = require("../common");

module.exports = {
  sign: async function(arch, buildPath) {
    let appBundle = `${buildPath}/${$.appName()}.app`;

    $.say("Signing Application bundle...");
    const signKey = "Developer ID Application: Amos Wenger (B2N6FSRTPV)";
    $(
      await $.sh(
        `codesign --deep --force --verbose --sign "${signKey}" ${appBundle}`
      )
    );
    $(await $.sh(`codesign --verify -vvvv ${appBundle}`));
    $(await $.sh(`spctl -a -vvvv ${appBundle}`));
  },

  package: async function(arch, buildPath) {
    await $.showVersions(["7za"]);
    $(await $.npmDep("appdmg", "appdmg"));

    $.say("Moving app bundle somewhere more palatable");
    $(
      await $.sh(
        `ditto -v "${buildPath}/${$.appName()}.app" ${$.appName()}.app`
      )
    );

    $.say("Compressing .zip archive");
    $(await $.sh(`7za a packages/${$.appName()}-mac.zip ${$.appName()}.app`));

    $.say("Creating a .dmg volume");
    const dmgjson = {
      title: $.appName(),
      icon: `../release/images/${$.appName()}-icons/itch.icns`, // sic. it's really itch.icns
      background: "../release/images/dmgbg.png",
      ["icon-size"]: 80,
      contents: [
        { x: 190, y: 382, type: "file", path: `../${$.appName()}.app` },
        { x: 425, y: 382, type: "link", path: "/Applications" },
      ],
    };
    await $.writeFile("build/appdmg.json", JSON.stringify(dmgjson, 0, 2));

    $(await $.sh(`appdmg build/appdmg.json packages/${$.appName()}-mac.dmg`));
  },
};
