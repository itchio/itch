
const flatbuffers = require("./flatbuffers").flatbuffers;

import sf from "../util/sf";
import * as net from "net";
import {ReadStream, WriteStream} from "fs";

type FlatbuffersBuilder = any;

interface IBuilderFunc {
  (builder: FlatbuffersBuilder): void;
};

export default class Connection {
  readPath: string;
  writePath: string;
  readable: ReadStream;
  writable: WriteStream;

  constructor (pipeName: string) {
    let prefix = "/tmp";
    if (process.platform === "win32") {
      prefix = "";
    }
    this.readPath = pipeName + ".runwrite";
    this.writePath = pipeName + ".runread";
  }

  async connect () {
    if (process.platform === "win32") {
      this.readable = await this.connectNamedPipe(this.readPath);
      this.writable = await this.connectNamedPipe(this.writePath);
    } else {
      this.readable = sf.createReadStream(this.readPath, {
        encoding: "binary",
      });
      this.writable = sf.createWriteStream(this.writePath, {
        defaultEncoding: "binary",
      });
    }
  }

  writePacket(f: IBuilderFunc) {
    const builder = new flatbuffers.Builder(1024);
    f(builder);

    const msgbuf = builder.asUint8Array();
    const lenbuf = new Buffer(4);
    lenbuf.writeUInt32LE(msgbuf.length, 0);

    this.writable.write(lenbuf);
    this.writable.write(Buffer.from(msgbuf));
  }

  close() {
    this.writable.end();
  }

  private async connectNamedPipe(pipePath: string): Promise<any> {
    return await new Promise((resolve, reject) => {
      let connected = false;
      const conn = net.connect(`\\\\.\\pipe\\${pipePath}`, () => {
        connected = true;
        resolve(conn);
      });
      setTimeout(() => {
        if (!connected) {
          reject(`capsule: timeout while connecting to ${pipePath}`);
        }
      }, 200);
    });
  }
}
