#!/usr/bin/env node

// generate itch package for various platforms

const ospath = require('path');

const $ = require('./common');
const darwin = require('./package/darwin');
const windows = require('./package/windows');
const linux = require('./package/linux');

const bluebird = require('bluebird');

async function ci_package (args) {
  if (args.length !== 2) {
    throw new Error(`ci-package expects two arguments, not ${args.length}. (got: ${args.join(', ')})`);
  }
  const [os, arch] = args;

  if (!$.OSES[os]) {
    throw new Error(`invalid os ${os}, must be one of ${Object.keys($.OSES).join(', ')}`);
  }

  const arch_info = $.ARCHES[arch];
  if (!arch_info) {
    throw new Error(`invalid arch ${arch}, must be one of ${Object.keys($.ARCHES).join(', ')}`);
  }

  $.say(`Packaging ${$.app_name()} for ${os}-${arch}`);

  $.say('Decompressing dist...');
  $(await $.sh('tar xf dist.tar'));

  $.say('Copying modules...');
  $(await $.sh('cp -rf node_modules dist/'));

  await $.show_versions(['npm', 'node']);
  $(await $.npm('install'));

  const electronVersion = JSON.parse(await $.read_file('./node_modules/electron/package.json')).version;
  $.say(`Using electron ${electronVersion}`)

  const appName = $.app_name();
  const appVersion = $.build_version();
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
    prune: true,
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
  if (os === windows) {
    packages.push('electron-winstaller@2.5.2');
  }
  $(await $.npm(`install ${packages.join(' ')}`));

  const electronPackager = bluebird.promisify(require('electron-packager'));
  const electronRebuild = require('electron-rebuild').default;

  $.say('Packaging with binary release...');
  const electronConfigKey = `${os}-${arch_info.electron_arch}`;
  const electronFinalOptions = Object.assign({}, electronOptions[electronConfigKey], {
    afterCopy: [
      async (buildPath, electronVersion, platform, arch, callback) => {
        $.say('Rebuilding native dependencies...');
        try {
          await electronRebuild(buildPath, electronVersion, arch, [], true);
          callback();
        } catch (err) {
          $.say(`While building native deps:\n${err.stack}`);
          callback(err);
        }
      }
    ]
  });
  const appPaths = await $.measure("electron package + rebuild", async () => {
    return await electronPackager(electronFinalOptions);
  });
  const build_path = appPaths[0];

  $.say(`Built app is in ${build_path}`);

  switch (os) {
    case 'windows':
      await windows.sign(arch, build_path);
      break
    case 'darwin':
      await darwin.sign(arch, build_path);
      break
    case 'linux':
      // tl;dr code-signing on Linux isn't a thing
      break
  }

  $.say('Grabbing butler');
  const ext = (os === 'windows' ? '.exe' : '');
  const butler_name = `butler${ext}`;
  const butler_arch = (process.arch === 'x64' ? 'amd64' : '386');
  const butler_url = `https://dl.itch.ovh/butler/${os}-${butler_arch}/head/${butler_name}`;
  $(await $.sh(`curl -L -O ${butler_url}`));
  $(await $.sh(`chmod +x ${butler_name}`));
  $(await $.sh(`./butler --version`));

  if (process.env.NO_BUTLER == "1") {
    $.say('NO_BUTLER=1 set, not pushing with butler');
  } else {
    let butler_channel = os
    let artifact_path = build_path
    if (os === 'darwin') {
      butler_channel = 'mac'
      artifact_path = `${build_path}/${$.app_name()}.app`
    }

    butler_channel = `${butler_channel}-${arch === '386' ? '32' : '64'}`
    const butler_target = `fasterthanlime/${$.app_name()}`
    $.say('Pushing to itch.io...');
    let push_path = build_path
    $(await $.sh(`./butler push ${artifact_path} ${butler_target}:${butler_channel} --userversion=${$.build_version()}`))
  }

  switch (os) {
    case 'windows':
      await windows.package(arch, build_path);
      break
    case 'darwin':
      await darwin.package(arch, build_path);
      break
    case 'linux':
      $.say('.deb package')
      await linux.package_deb(arch, build_path);

      $.say('.portable binary archive')
      await linux.package_portable(arch, build_path);

      $.say('.rpm package')
      await linux.package_rpm(arch, build_path);
      break
  }
}

ci_package(process.argv.slice(2))
