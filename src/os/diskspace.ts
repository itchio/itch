import spawn from "./spawn";
import * as os from ".";

import { ISpaceInfo, IPartInfo, IPartsInfo } from "../types";
import Context from "../context";
import { devNull } from "../logger";

/*
 * Heavily based on https://github.com/int0h/npm-hddSpace
 */
let self = {
  dfRun: async (ctx: Context) => {
    const lines = [] as string[];
    const opts = {
      command: "df",
      args: ["-kP"],
      onToken: (token: string) => lines.push(token),
      ctx,
      logger: devNull,
    };
    await spawn(opts);
    return lines;
  },

  df: async (ctx: Context): Promise<IPartsInfo> => {
    const lines = await self.dfRun(ctx);

    const resultObj = {} as IPartsInfo;
    let rootPart: IPartInfo;

    resultObj.parts = lines
      .slice(1) // remove header
      .map(line => {
        const partInfo = {} as IPartInfo;
        const lineParts = line.split(/[\s]+/g);
        partInfo.mountpoint = lineParts[5];
        partInfo.free = parseInt(lineParts[3], 10) * 1024; // 1k blocks
        partInfo.size = parseInt(lineParts[1], 10) * 1024; // 1k blocks

        if (Number.isNaN(partInfo.free) || Number.isNaN(partInfo.size)) {
          return null;
        }

        if (partInfo.mountpoint === "/") {
          rootPart = partInfo;
        }
        return partInfo;
      })
      .filter(part => !!part);

    resultObj.total = {
      size: rootPart.size,
      free: rootPart.free,
    };
    return resultObj;
  },

  wmicRun: async (ctx: Context) => {
    const lines = [] as string[];
    let opts = {
      command: "wmic",
      args: ["logicaldisk", "get", "size,freespace,caption"],
      onToken: (token: string) => lines.push(token),
      ctx,
      logger: devNull,
    };
    await spawn(opts);
    return lines;
  },

  wmicTotal: (parts: IPartInfo[]) => {
    let initial = { size: 0, free: 0 };
    let f = (total: ISpaceInfo, part: IPartInfo) => {
      total.size += part.size;
      total.free += part.free;
      return total;
    };

    return parts.reduce(f, initial);
  },

  wmic: async (ctx: Context): Promise<IPartsInfo> => {
    const lines = await self.wmicRun(ctx);

    const resultObj = {} as IPartsInfo;
    resultObj.parts = lines
      .slice(1) // remove header
      .map(line => {
        let diskInfo = {} as IPartInfo;
        let lineParts = line.split(/[\s]+/g);
        diskInfo.letter = lineParts[0];
        diskInfo.free = parseInt(lineParts[1], 10);
        diskInfo.size = parseInt(lineParts[2], 10);
        if (
          Number.isNaN(diskInfo.free) ||
          Number.isNaN(diskInfo.size) ||
          diskInfo.letter === ""
        ) {
          return null;
        }
        return diskInfo;
      })
      .filter(part => !!part);

    resultObj.total = self.wmicTotal(resultObj.parts);
    return resultObj;
  },

  /** Return a list of partitions/disks and information on their free / total space. */
  diskInfo: async function(ctx: Context): Promise<IPartsInfo> {
    if (os.platform() === "win32") {
      return await self.wmic(ctx);
    } else {
      return await self.df(ctx);
    }
  },

  /** Given a Win32 file path, returns the disk letter on which it is. */
  letterFor: function(folder: string): string {
    let matches = folder.match(/^([A-Za-z]):/);
    if (!matches) {
      matches = folder.match(/^\/([A-Za-z])/);
    }

    if (!matches) {
      return null;
    }

    return matches[1].toUpperCase() + ":";
  },

  /**  */
  freeInFolder: function(diskInfo: IPartsInfo, folder: string): number {
    if (!diskInfo.parts) {
      // incomplete diskinfo
      return -1;
    }

    if (typeof folder !== "string") {
      return -1;
    }

    if (os.platform() === "win32") {
      let letter = self.letterFor(folder);
      if (!letter) {
        return -1;
      }

      for (const part of diskInfo.parts) {
        if (part.letter === letter) {
          // break out of loop, there's no nested mountpoints on Windows
          return part.free;
        }
      }
    } else {
      let match: IPartInfo = null;

      for (const part of diskInfo.parts) {
        // TODO: what about case-insensitive FSes ?
        if (!folder.startsWith(part.mountpoint)) {
          continue; // doesn't contain folder
        }

        if (match && match.mountpoint.length > part.mountpoint.length) {
          continue; // skip, already got a longer match
        }
        match = part;
      }

      if (match) {
        return match.free;
      }
    }

    return -1;
  },
};

export default self;
