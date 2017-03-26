#!/usr/bin/env node

// generate itch package for various platforms

const $ = require('./common')
const darwin = require('./package/darwin')
const windows = require('./package/windows')
const linux = require('./package/linux')

function ci_package (args) {
  if (args.length !== 2) {
    throw new Error(`ci-package expects two arguments, not ${args.length}. (got: ${args.join(', ')})`)
  }
  const [os, arch] = args

  if (!$.OSES[os]) {
    throw new Error(`invalid os ${os}, must be one of ${Object.keys($.OSES).join(', ')}`)
  }

  const arch_info = $.ARCHES[arch]
  if (!arch_info) {
    throw new Error(`invalid arch ${arch}, must be one of ${Object.keys($.ARCHES).join(', ')}`)
  }

  // for Gruntfile.js
  process.env.CI_CHANNEL = $.channel_name()
  process.env.CI_WINDOWS_INSTALLER_PATH = $.winstaller_path(arch)

  $.say(`Packaging ${$.app_name()} for ${os}-${arch}`)

  $.say('Decompressing stage...')
  $($.sh('tar xf stage.tar.gz'))

  $.show_versions(['npm', 'node'])

  $($.npm_dep('grunt', 'grunt-cli'))
  $($.npm('install'))

  $($.sh('mkdir -p packages'))

  $.say('Packaging with binary release')
  $($.grunt(`-v electron:${os}-${arch_info.electron_arch}`))
  let electron_os = (os === 'windows' ? 'win32' : os)
  const build_path = `build/${$.build_tag()}/${$.app_name()}-${electron_os}-${arch_info.electron_arch}`

  switch (os) {
    case 'windows':
      windows.sign(arch, build_path)
      break
    case 'darwin':
      darwin.sign(arch, build_path)
      break
    case 'linux':
      // tl;dr code-signing on Linux isn't a thing
      break
  }

  $.say('Grabbing butler')
  let ext = (os === 'windows' ? '.exe' : '')
  let butler_name = `butler${ext}`
  let butler_arch = (process.arch === 'x64' ? 'amd64' : '386')
  let butler_url = `https://dl.itch.ovh/butler/${os}-${butler_arch}/head/${butler_name}`
  $($.sh(`curl -L -O ${butler_url}`))
  $($.sh(`chmod +x ${butler_name}`))
  $($.sh(`./butler --version`))

  let channel = os
  let artifact_path = build_path
  if (os === 'darwin') {
    channel = 'mac'
    artifact_path = `${build_path}/${$.app_name()}.app`
  }

  channel = `${channel}-${arch === '386' ? '32' : '64'}`
  const target = `fasterthanlime/${$.app_name()}`
  $.say('Pushing to itch.io')
  let push_path = build_path
  // $($.sh(`./butler push ${artifact_path} ${target}:${channel} --userversion=${$.build_version()}`))

  switch (os) {
    case 'windows':
      windows.package(arch, build_path)
      break
    case 'darwin':
      darwin.package(arch, build_path)
      break
    case 'linux':
      $.say('.deb package')
      linux.package_deb(arch, build_path)

      $.say('.portable binary archive')
      linux.package_portable(arch, build_path)

      $.say('.rpm package')
      linux.package_rpm(arch, build_path)
      break
  }
}

ci_package(process.argv.slice(2))
