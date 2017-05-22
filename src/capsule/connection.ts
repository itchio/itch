
import {flatbuffers} from "./flatbuffers";

import sf from "../os/sf";
import {ReadStream, WriteStream} from "fs";

interface IBuilderFunc {
  (builder: flatbuffers.Builder): void;
};

export default class Connection {
  closed: boolean;
  readPath: string;
  writePath: string;
  readable: ReadStream;
  writable: WriteStream;

  constructor (pipeName: string) {
    let prefix = "/tmp/";
    if (process.platform === "win32") {
      prefix = "\\\\.\\pipe\\";
    }
    this.readPath = prefix + pipeName + ".runwrite";
    this.writePath = prefix + pipeName + ".runread";
    this.closed = false;
  }

  async connect () {
    this.writable = sf.createWriteStream(this.writePath, {
      defaultEncoding: "binary",
    });
    this.readable = sf.createReadStream(this.readPath, {
      encoding: "binary",
    });
  }

  writePacket(f: IBuilderFunc) {
    if (this.closed) {
      return;
    }

    const builder = new flatbuffers.Builder(1024);
    f(builder);

    const msgbuf = builder.asUint8Array();
    const lenbuf = new Buffer(4);
    lenbuf.writeUInt32LE(msgbuf.length, 0);

    this.writable.write(lenbuf);
    this.writable.write(msgbuf.buffer);
  }

  close() {
    this.writable.end();
    this.closed = true;
  }
}
