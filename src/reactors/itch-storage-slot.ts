import { exists, mkdir, writeFile, readFile } from "../os/sf";
import { join, dirname } from "path";

/**
 * Store and retrieve a .json file in the `.itch` directory
 * of an installation with some typed data
 */
export default class ItchStorageSlot<T> {
  constructor(private name: string) {}

  async save(basePath: string, value: T) {
    if (!await exists(basePath)) {
      // silently not saving if the dest folder doesn't exist yet
      return;
    }

    const fullPath = this.makePath(basePath);
    await mkdir(dirname(fullPath));

    const contents = JSON.stringify(value);
    await writeFile(fullPath, contents);
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
    return join(basePath, ".itch", this.name);
  }
}
