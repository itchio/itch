#!/usr/bin/env node

// generate itch package for various platforms

const ospath = require('path');

const $ = require('./common');

const bluebird = require('bluebird');

async function ciPackage (argsIn) {
  const opts = {
    buildOnly: false,
  }
  const args = [];

  for (const arg of argsIn) {
    if (arg === "--build-only") {
      opts.buildOnly = true;
    } else {
      args.push(arg);
    }
  }

  if (args.length !== 2) {
    throw new Error(`ci-package expects two arguments, not ${args.length}. (got: ${args.join(', ')})`);
  }
  const [os, arch] = args;

  if (!$.OSES[os]) {
    throw new Error(`invalid os ${os}, must be one of ${Object.keys($.OSES).join(', ')}`);
  }

  const archInfo = $.ARCHES[arch];
  if (!archInfo) {
    throw new Error(`invalid arch ${arch}, must be one of ${Object.keys($.ARCHES).join(', ')}`);
  }

  $.say(`Packaging ${$.appName()} for ${os}-${arch}`);

  $.say('Decompressing dist...');
  $(await $.sh('tar xf dist.tar'));

  $.say('Installing modules...');
  await $.showVersions(['yarn', 'node']);
  $(await $.yarn('install'));

  $.say('Copying modules...');
  $(await $.sh('cp -rf node_modules dist/'));

  const electronVersion = JSON.parse(await $.readFile('node_modules/electron/package.json')).version;
  $.say(`Using electron ${electronVersion}`)

  const appName = $.appName();
  const appVersion = $.buildVersion();
  const outDir = ospath.join("build", "v" + appVersion);
  const companyName = "Itch Corp";

  var iconsPath = ospath.join('release', 'images', appName + '-icons')
  var icoPath = ospath.join(iconsPath, 'itch.ico')
  var icnsPath = ospath.join(iconsPath, 'itch.icns')
  var installerGifPath = 'release/images/installer.gif'

  const electronSharedOptions = {
    dir: 'dist',
    name: appName,
    electronVersion,
    appVersion,
    asar: true,
    overwrite: true,
    out: outDir
  };

  const electronWindowsOptions = Object.assign({}, electronSharedOptions, {
    platform: 'win32',
    icon: icoPath,
    'version-string': {
      CompanyName: companyName,
      LegalCopyright: 'MIT license, (c) itch corp.',
      FileDescription: appName,
      OriginalFileName: appName + '.exe',
      FileVersion: appVersion,
      AppVersion: appVersion,
      ProductName: appName,
      InternalName: appName + '.exe'
    }
  });

  const electronOptions = {
    'windows-ia32': Object.assign({arch: 'ia32'}, electronWindowsOptions),
    'darwin-x64': Object.assign({}, electronSharedOptions, {
      platform: 'darwin',
      arch: 'x64',
      icon: icnsPath,
      'app-bundle-id': 'io.' + appName + '.mac',
      'app-category-type': 'public.app-category.games',
      protocols: [{name: 'itch.io', schemes: [appName + 'io']}]
    }),
    'linux-ia32': Object.assign(
        {}, electronSharedOptions, {platform: 'linux', arch: 'ia32'}),
    'linux-x64': Object.assign(
        {}, electronSharedOptions, {platform: 'linux', arch: 'x64'}),
  };

  $(await $.sh('mkdir -p packages'));

  $.say('Installing electron packaging tools...');
  packages = ['electron-packager@8.6.0'];
  if (os === 'windows') {
    packages.push('electron-winstaller@2.5.2');
  }
  $(await $.npm(`install ${packages.join(' ')}`));

  const darwin = require('./package/darwin');
  const windows = require('./package/windows');
  const linux = require('./package/linux');

  const electronPackager = bluebird.promisify(require('electron-packager'));
  const electronRebuild = require('electron-rebuild').default;

  $.say('Packaging with binary release...');
  const electronConfigKey = `${os}-${archInfo.electronArch}`;
  const electronFinalOptions = Object.assign({}, electronOptions[electronConfigKey], {
    afterCopy: [
      async (buildPath, electronVersion, platform, arch, callback) => {
        $.say('Pruning dev packages');
        try {
          await $.cd(buildPath, async function () {
            await $.yarn('install --production --ignore-scripts');
          });
        } catch (err) {
          $.say(`While pruning dev packages:\n${err.stack}`);
          callback(err);
        }

        $.say('Rebuilding native dependencies...');
        try {
          await electronRebuild(buildPath, electronVersion, arch, [], true);
        } catch (err) {
          $.say(`While building native deps:\n${err.stack}`);
          callback(err);
        }

        callback();
      }
    ]
  });
  const appPaths = await $.measure("electron package + rebuild", async () => {
    return await electronPackager(electronFinalOptions);
  });
  let buildPath = appPaths[0].replace(/\\/g, "/");

  $.say(`Built app is in ${buildPath}`);

  if (opts.buildOnly) {
    return;
  }

  switch (os) {
    case 'windows':
      await windows.sign(arch, buildPath);
      break
    case 'darwin':
      await darwin.sign(arch, buildPath);
      break
    case 'linux':
      // tl;dr code-signing on Linux isn't a thing
      break
  }

  if (process.env.BUTLER_ENABLE == "1") {
    $.say('Grabbing butler');
    const ext = (os === 'windows' ? '.exe' : '');
    const butlerName = `butler${ext}`;
    const butlerArch = (process.arch === 'x64' ? 'amd64' : '386');
    const butlerUrl = `https://dl.itch.ovh/butler/${os}-${butlerArch}/head/${butlerName}`;
    $(await $.sh(`curl -L -O ${butlerUrl}`));
    $(await $.sh(`chmod +x ${butlerName}`));
    $(await $.sh(`./butler --version`));

    let butlerChannel = os
    let artifactPath = buildPath
    if (os === 'darwin') {
      butlerChannel = 'mac'
      artifactPath = `${buildPath}/${$.appName()}.app`
    }

    butlerChannel = `${butlerChannel}-${arch === '386' ? '32' : '64'}`
    const butlerTarget = `fasterthanlime/${$.appName()}`
    $.say('Pushing to itch.io...');
    let pushPath = buildPath
    $(await $.sh(`./butler push ${artifactPath} ${butlerTarget}:${butlerChannel} --userversion=${$.buildVersion()}`))
  }

  switch (os) {
    case 'windows':
      await windows.package(arch, buildPath);
      break
    case 'darwin':
      await darwin.package(arch, buildPath);
      break
    case 'linux':
      $.say('.deb package')
      await linux.packageDeb(arch, buildPath);

      $.say('.portable binary archive')
      await linux.packagePortable(arch, buildPath);

      $.say('.rpm package')
      await linux.packageRpm(arch, buildPath);
      break
  }
}

ciPackage(process.argv.slice(2))
