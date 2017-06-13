
import suite, {fixture} from "../test-suite";

import diskspace from "./diskspace";
import * as os from "./";

suite(__filename, s => {
  s.case("df (macOS 10.11)", async (t) => {
    t.stub(diskspace, "dfRun").resolves(fixture.lines("diskspace", "df-osx-10.11"));
    const out = await diskspace.df();
    t.same(out, {
      parts: [
        {free: 10112122880, mountpoint: "/", size: 249769230336},
        {free: 0, mountpoint: "/dev", size: 187392},
      ],
      total: {free: 10112122880, size: 249769230336},
    });
  });

  s.case("df (Ubuntu)", async (t) => {
    t.stub(diskspace, "dfRun").resolves(fixture.lines("diskspace", "df-ubuntu-15.10"));
    const out = await diskspace.df();
    t.same(out, {
      parts: [
        {free: 938479616, mountpoint: "/dev", size: 938479616},
        {free: 166813696, mountpoint: "/run", size: 188514304},
        {free: 117629616128, mountpoint: "/", size: 125208051712},
        {free: 942559232, mountpoint: "/dev/shm", size: 942563328},
        {free: 5242880, mountpoint: "/run/lock", size: 5242880},
        {free: 942563328, mountpoint: "/sys/fs/cgroup", size: 942563328},
        {free: 102400, mountpoint: "/run/cgmanager/fs", size: 102400},
        {free: 188514304, mountpoint: "/run/user/1000", size: 188514304},
      ],
      total: {free: 117629616128, size: 125208051712},
    });
  });

  s.case("df (ArchLinux)", async (t) => {
    t.stub(diskspace, "dfRun").resolves(fixture.lines("diskspace", "df-archlinux"));
    const out = await diskspace.df();
    t.same(out, {
      parts: [
        {free: 520163328, mountpoint: "/dev", size: 520163328},
        {free: 522567680, mountpoint: "/run", size: 522940416},
        {free: 4271767552, mountpoint: "/", size: 7929298944},
        {free: 522936320, mountpoint: "/dev/shm", size: 522940416},
        {free: 522940416, mountpoint: "/sys/fs/cgroup", size: 522940416},
        {free: 522940416, mountpoint: "/tmp", size: 522940416},
        {free: 1679458304, mountpoint: "/home", size: 2143109120},
        {free: 10140364800, mountpoint: "/vagrant", size: 249769230336},
        {free: 104591360, mountpoint: "/run/user/998", size: 104591360},
      ],
      total: {free: 4271767552, size: 7929298944},
    });
  });

  s.case("wmic (Windows 10.11)", async (t) => {
    t.stub(diskspace, "wmicRun").resolves(fixture.lines("diskspace", "wmic-windows-8.1"));
    const out = await diskspace.wmic();
    t.same(out, {
      parts: [
        {free: 41468653568, letter: "C:", size: 128034672640},
        {free: 193326485504, letter: "D:", size: 1000194015232},
        {free: 164778627072, letter: "E:", size: 1000202039296},
      ],
      total: {free: 399573766144, size: 2128430727168},
    });
  });

  s.case("letterFor", (t) => {
    let letter = diskspace.letterFor("C:\\Users\\amos\\Downloads");
    t.is(letter, "C:", "extracts letter");

    letter = diskspace.letterFor("z:\\is\\for\\zoidberg");
    t.is(letter, "Z:", "capitalizes correctly");

    letter = diskspace.letterFor("i:/am/not/sure/anymore");
    t.is(letter, "I:", "supports mingw paths");

    letter = diskspace.letterFor("/d/ora/the/file/explorer");
    t.is(letter, "D:", "supports mingw paths");

    letter = diskspace.letterFor("smb://pluto/goodies");
    t.notOk(letter, "doesn\'t extract letters for non-local paths");
  });

  s.case("freeInFolder (unix)", (t) => {
    t.stub(os, "platform").returns("linux");

    const diskInfo = {
      parts: [
        {free: 111, mountpoint: "/media/usb1", size: 0},
        {free: 0, mountpoint: "/media/cdrom0", size: 0},
        {free: 333, mountpoint: "/", size: 0},
      ],
      total: {
        free: 0, size: 0,
      },
    };

    let free = diskspace.freeInFolder(diskInfo, "/media/cdrom0/AUTORUN.bat");
    t.is(free, 0, "on cdrom");

    free = diskspace.freeInFolder(diskInfo, "/media/usb1/Diego el Rey del juego/Juegos de Itch");
    t.is(free, 111, "on usb disk");

    free = diskspace.freeInFolder(diskInfo, "/home/diego/Downloads");
    t.is(free, 333, "on root");

    free = diskspace.freeInFolder(diskInfo, "https://itch.io/app");
    t.is(free, -1, "non-local path");

    free = diskspace.freeInFolder(diskInfo, "");
    t.is(free, -1, "empty path");
  });

  s.case("freeInFolder (windows)", (t) => {
    t.stub(os, "platform").returns("win32");

    const diskInfo = {
      parts: [
        {free: 111, letter: "C:", size: 0},
        {free: 222, letter: "D:", size: 0},
        {free: 0, letter: "Z:", size: 0},
      ],
      total: {free: 0, size: 0},
    };

    let free = diskspace.freeInFolder(diskInfo, "c:\\");
    t.is(free, 111, "on C:");

    free = diskspace.freeInFolder(diskInfo, "D:\\Tomorrow\\we\\dine\\it\'s\\swell");
    t.is(free, 222, "on D:");

    free = diskspace.freeInFolder(diskInfo, "/z/dosbox");
    t.is(free, 0, "on Z:");

    free = diskspace.freeInFolder(diskInfo, "E:\\Uh\\oh");
    t.is(free, -1, "on non-existant letter drive");

    free = diskspace.freeInFolder(diskInfo, "https://itch.io/app");
    t.is(free, -1, "non-local path");

    free = diskspace.freeInFolder(diskInfo, "");
    t.is(free, -1, "empty path");
  });
});
