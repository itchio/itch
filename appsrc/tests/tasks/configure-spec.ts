
// tslint:disable:no-shadowed-variable

import test = require ("zopf");
import * as sinon from "sinon";
import * as proxyquire from "proxyquire";
import * as path from "path";

import {EventEmitter} from "events";

import fixture from "../fixture";

import mklog from "../../util/log";
const logger = new mklog.Logger({sinks: {console: false}});
const opts = {id: "kalamazoo", logger};

test("configure", (t) => {
  const os = test.module({
    itchPlatform: () => null,
  });

  const noop = () => Promise.resolve();

  const windows: any = test.module({});
  const osx: any = test.module({});
  const linux: any = test.module({});

  for (const fakeModule of [windows, osx, linux]) {
    fakeModule.configure = sinon.spy(() => Promise.resolve({executables: [] as string[]}));
  }

  const pathmaker = test.module({
    appPath: () => "/dev/null",
    caveLogger: () => new mklog.Logger(),
  });
  const globalMarket = test.module({
    saveEntity: noop,
  });

  const stubs = {
    "../util/os": os,
    "./configure/windows": windows,
    "./configure/osx": osx,
    "./configure/linux": linux,
    "./configure/compute-size": test.module({
      computeFolderSize: async function (): Promise<number> { return 0; },
    }),
    "../util/pathmaker": pathmaker,
  };

  const configure = proxyquire("../../tasks/configure", stubs);
  const platforms: any = {windows, osx, linux};

  t.case("rejects unsupported platform", (t) => {
    t.stub(os, "itchPlatform").returns("irix");
    const out = new EventEmitter();
    return t.rejects(configure.default(out, opts));
  });

  ["windows", "osx", "linux"].forEach((platform) => {
    t.case(`configures for ${platform}`, async (t) => {
      t.stub(os, "itchPlatform").returns(platform);

      const out = new EventEmitter();
      await configure.default(out, {
        ...opts, cave: {}, game: {}, upload: {}, globalMarket,
      });
      t.true(platforms[platform].configure.called, `${platform} configure was called`);
    });
  });
});

test("configure (each platform)", (t) => {
  const originalSf = require("../../util/sf").default;
  const sf = test.module({
    "chmod": () => Promise.resolve(),
    "lstat": originalSf.lstat,
    "glob": originalSf.glob,
    "@global": true,
  });
  const stubs = {
    "../../util/sf": sf,
  };

  const windows = proxyquire("../../tasks/configure/windows", stubs);
  const windowsPath = fixture.path("configure/windows");

  t.case("windows finds bats and exes", async function (t) {
    const res = await windows.configure(opts, windowsPath);
    const names = [
      "game.exe", "launcher.bat",
      path.join("resources", "editor.exe"),
      path.join("resources", "quite", "deep", "share.bat"),
    ];
    t.samePaths(res.executables, names);
  });

  const osx = proxyquire("../../tasks/configure/osx", stubs);
  const osxPath = fixture.path("configure/osx");

  t.case("osx finds app bundles", async function (t) {
    const res = await osx.configure(opts, osxPath);
    const names = [
      "Some Grand Game.app/",
    ];
    t.samePaths(res.executables, names);
  });

  const osxNestedPath = fixture.path("configure/osx-nested");

  t.case("osx finds nested app bundles", async function (t) {
    const res = await osx.configure(opts, osxNestedPath);
    const names = [
      "osx64/dragonjousting.app/",
      "osx64/dragonjousting.app/Contents/Frameworks/node-webkit Helper EH.app/",
      "osx64/dragonjousting.app/Contents/Frameworks/node-webkit Helper NP.app/",
      "osx64/dragonjousting.app/Contents/Frameworks/node-webkit Helper.app/",
    ];
    t.samePaths(res.executables, names);
  });

  const osxSymlinkPath = fixture.path("configure/osx-symlink");

  t.case("osx does not find bundles in symlinks", async function (t) {
    const res = await osx.configure(opts, osxSymlinkPath);
    const names = [
      "hello.app/",
    ];
    t.samePaths(res.executables, names);
  });

  const linux = proxyquire("../../tasks/configure/linux", stubs);
  const linuxPath = fixture.path("configure/linux");

  t.case("osx finds scripts & binaries when there's no app bundles", async function (t) {
    const res = await osx.configure(opts, linuxPath);
    const names = [
      "bin/mach-o",
      "bin/mach-o-bis",
      "OpenHexagon",
      "quine",
    ];
    t.samePaths(res.executables, names);
  });

  t.case("linux finds scripts & binaries", async function (t) {
    const res = await linux.configure(opts, linuxPath);
    const names = [
      "bin/game32",
      "bin/game64",
      "OpenHexagon",
      "quine",
    ];
    t.samePaths(res.executables, names);
  });
});
