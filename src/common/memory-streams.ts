import { Writable, WritableOptions } from "readable-stream";

export class WritableMemoryStream extends Writable {
  private chunks: Buffer[] = [];

  constructor(options?: WritableOptions) {
    super(options);
  }

  _write(chunk: Buffer, encoding: string, callback: () => void): void {
    this.chunks.push(
      Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding)
    );
    callback();
  }

  toString(): string {
    return this.toBuffer().toString();
  }

  toBuffer(): Buffer {
    return Buffer.concat(this.chunks);
  }
}
