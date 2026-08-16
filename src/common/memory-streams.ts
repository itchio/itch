export class WritableMemoryStream {
  private chunks: string[] = [];

  write(chunk: string): void {
    this.chunks.push(chunk);
  }

  toString(): string {
    return this.chunks.join("");
  }

  destroy(): void {
    this.chunks = [];
  }
}
