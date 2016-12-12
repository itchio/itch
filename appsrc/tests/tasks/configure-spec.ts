
// tslint:disable:no-shadowed-variable

import test = require ("zopf");
import * as proxyquire from "proxyquire";
import * as path from "path";

import {EventEmitter} from "events";

import fixture from "../fixture";

import mklog from "../../util/log";
const logger = new mklog.Logger({sinks: {console: false}});
const opts = {id: "kalamazoo", logger};

test("configure", (t) => {
  const os = test.module({
    platform: () => null,
  });

  const noop = () => Promise.resolve();
  const win32 = test.module({configure: noop});
  const darwin = test.module({configure: noop});
  const linux = test.module({configure: noop});
  const pathmaker = test.module({
    appPath: () => "/dev/null",
    caveLogger: () => new mklog.Logger(),
  });
  const globalMarket = test.module({
    saveEntity: noop,
  });

  const stubs = {
    "../util/os": os,
    "./configure/win32": win32,
    "./configure/darwin": darwin,
    "./configure/linux": linux,
    "./configure/compute-size": test.module({
      computeFolderSize: async function (): Promise<number> { return 0; },
    }),
    "../util/pathmaker": pathmaker,
  };

  const configure = proxyquire("../../tasks/configure", stubs);
  const platforms = {win32, darwin, linux};

  t.case("rejects unsupported platform", (t) => {
    t.stub(os, "platform").returns("irix");
    const out = new EventEmitter();
    return t.rejects(configure.default(out, opts));
  });

  ["win32", "darwin", "linux"].forEach((platform) => {
    t.case(platform, (t) => {
      t.stub(os, "platform").returns(platform);
      t.mock((platforms as any)[platform]).expects("configure").resolves({executables: []});
      const out = new EventEmitter();
      return configure.default(out, {
        ...opts, cave: {}, game: {}, upload: {}, globalMarket,
      });
    });
  });
});

test("configure (each platform)", (t) => {
  const originalSf = require("../../util/sf").default;
  const sf = test.module({
    chmod: () => Promise.resolve(),
    glob: originalSf.glob,
    "@global": true,
  });
  const stubs = {
    "../../util/sf": sf,
  };

  const win32 = proxyquire("../../tasks/configure/win32", stubs).default;
  const win32Path = fixture.path("configure/win32");

  t.case("win32 finds bats and exes", async function (t) {
    const res = await win32.configure(win32Path);
    const names = [
      "game.exe", "launcher.bat",
      path.join("resources", "editor.exe"),
      path.join("resources", "quite", "deep", "share.bat"),
    ];
    t.samePaths(res.executables, names);
  });

  const darwin = proxyquire("../../tasks/configure/darwin", stubs).default;
  const darwinPath = fixture.path("configure/darwin");

  t.case("darwin finds app bundles", async function (t) {
    const res = await darwin.configure(darwinPath);
    const names = [
      "Some Grand Game.app/",
    ];
    t.samePaths(res.executables, names);
  });

  const darwinNestedPath = fixture.path("configure/darwin-nested");

  t.case("darwin finds nested app bundles", async function (t) {
    const res = await darwin.configure(darwinNestedPath);
    const names = [
      "osx64/dragonjousting.app/",
      "osx64/dragonjousting.app/Contents/Frameworks/node-webkit Helper EH.app/",
      "osx64/dragonjousting.app/Contents/Frameworks/node-webkit Helper NP.app/",
      "osx64/dragonjousting.app/Contents/Frameworks/node-webkit Helper.app/",
    ];
    t.samePaths(res.executables, names);
  });

  const darwinSymlinkPath = fixture.path("configure/darwin-symlink");

  t.case("darwin does not find bundles in symlinks", async function (t) {
    const res = await darwin.configure(darwinSymlinkPath);
    const names = [
      "hello.app/",
    ];
    t.samePaths(res.executables, names);
  });

  const linux = proxyquire("../../tasks/configure/linux", stubs).default;
  const linuxPath = fixture.path("configure/linux");

  t.case("darwin finds binaries when no app bundles", async function (t) {
    const res = await darwin.configure(linuxPath);
    const names = [
      "bin/mach-o",
      "bin/mach-o-bis",
      "OpenHexagon",
      "quine",
    ];
    t.samePaths(res.executables, names);
  });

  t.case("linux finds scripts & binaries", async function (t) {
    const res = await linux.configure(linuxPath);
    const names = [
      "bin/game32",
      "bin/game64",
      "OpenHexagon",
      "quine",
    ];
    t.samePaths(res.executables, names);
  });
});
