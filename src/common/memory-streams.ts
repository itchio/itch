import { Writable, WritableOptions } from "readable-stream";

export class WritableMemoryStream extends Writable {
  constructor(options?: WritableOptions) {
    super(options);
  }

  _write(chunk: Buffer, encoding: string, callback: () => void): void {
    callback();
  }

  toString(): string {
    return this.toBuffer().toString();
  }

  toBuffer(): Buffer {
    const buffers: Buffer[] = [];
    this._writableState.buffer.forEach((data: { chunk: Buffer }) => {
      buffers.push(data.chunk);
    });
    return Buffer.concat(buffers);
  }
}
