import { Writable, WritableOptions } from "readable-stream";

export class WritableMemoryStream extends Writable {
  private chunks: Buffer[] = [];

  constructor(options?: WritableOptions) {
    super(options);
  }

  _write(
    chunk: Buffer | string | Uint8Array,
    encoding: string,
    callback: () => void
  ): void {
    if (Buffer.isBuffer(chunk)) {
      this.chunks.push(chunk);
    } else if (typeof chunk === "string") {
      this.chunks.push(
        Buffer.from(
          chunk,
          Buffer.isEncoding(encoding) ? (encoding as BufferEncoding) : "utf8"
        )
      );
    } else {
      this.chunks.push(Buffer.from(chunk));
    }
    callback();
  }

  toString(): string {
    return this.toBuffer().toString();
  }

  toBuffer(): Buffer {
    return Buffer.concat(this.chunks);
  }
}
