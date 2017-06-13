
import suite, {fixture} from "../test-suite";

import {join} from "path";
import * as tmp from "tmp";

import {EventEmitter} from "events";

import * as sf from "./sf";

suite(__filename, s => {
  s.case("exists", async t => {
    t.true(await sf.exists(fixture.path("empty")));
    t.false(await sf.exists(fixture.path("a-classic-cake-song")));
  });

  s.case("readFile", async t => {
    t.same(await sf.readFile(fixture.path("txt"), {encoding: "utf8"}),
      "Hello there, just writing a bit of text for the sniffer specs\n");
  });

  s.case("writeFile", async t => {
    const contents = "What is head may never dye";
    let readContents: string;
    let err: Error;
    const tmpObj = tmp.fileSync();

    try {
      await sf.writeFile(tmpObj.name, contents, {encoding: "utf8"});
      readContents = await sf.readFile(tmpObj.name, {encoding: "utf8"});
    } catch (e) {
      err = e;
    } finally {
      tmpObj.removeCallback();
    }

    if (err) {
      throw err;
    }
    t.same(readContents, contents);
  });

  s.case("appendFile", async t => {
    const contentsA = "What is head";
    const contentsB = " may never dye";
    let readContents: string;
    let err: Error;
    const tmpObj = tmp.fileSync();

    try {
      await sf.writeFile(tmpObj.name, contentsA, {encoding: "utf8"});
      await sf.appendFile(tmpObj.name, contentsB, {encoding: "utf8"});
      readContents = await sf.readFile(tmpObj.name, {encoding: "utf8"});
    } catch (e) {
      err = e;
    } finally {
      tmpObj.removeCallback();
    }

    if (err) {
      throw err;
    }
    t.same(readContents, contentsA + contentsB);
  });

  s.case("wipe", async t => {
    let err: Error;
    const tmpObj = tmp.dirSync();

    const touch = async function (name: string) {
      const path = join(tmpObj.name, name);
      await sf.writeFile(path, name, {encoding: "utf8"});
    };

    try {
      await touch("hello.txt");
      await touch("super/deep/hello.txt");
      await touch("super/deep/hella.txt");
      await touch("super/cavernous/and/deep/into/the/temple/of/no.txt");
      await sf.wipe(tmpObj.name);
    } catch (e) {
      err = e;
    }

    if (err) {
      throw err;
    }
    t.false(await sf.exists(tmpObj.name));
  });

  s.case("promised (resolve 1)", async t => {
    const stream = new EventEmitter();
    const p = sf.promised(stream);
    setTimeout(() => stream.emit("close"), 0);
    await p;
  });

  s.case("promised (resolve 2)", async t => {
    const stream = new EventEmitter();
    const p = sf.promised(stream);
    setTimeout(() => stream.emit("end"), 0);
    await p;
  });

  s.case("promised (rejects)", async t => {
    const stream = new EventEmitter();
    const p = sf.promised(stream);
    setTimeout(() => stream.emit("error", new Error()), 0);
    await t.rejects(p);
  });
});
