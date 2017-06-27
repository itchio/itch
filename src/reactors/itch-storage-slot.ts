import { writeFile, readFile } from "../os/sf";
import { join } from "path";

/**
 * Store and retrieve a .json file in the `.itch` directory
 * of an installation with some typed data
 */
export default class ItchStorageSlot<T> {
  constructor(private name: string) {}

  async save(basePath: string, value: T) {
    const contents = JSON.stringify(value);
    await writeFile(this.makePath(basePath), contents);
  }

  async load(basePath: string): Promise<T> {
    try {
      const contents = await readFile(this.makePath(basePath));
      return JSON.parse(contents);
    } catch (e) {
      if (e.code === "ENOENT") {
        return null;
      } else {
        throw e;
      }
    }
  }

  private makePath(basePath: string): string {
    return join(basePath, this.name);
  }
}
