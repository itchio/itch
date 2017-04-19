
import * as path from "path";
import * as clone from "clone";

import sf from "../../util/sf";

import mklog from "../../util/log";
import {opts} from "../../logger";
const log = mklog("configure/html");

import { sortBy, uniq } from "underscore";

import { IGameRecord, IGameEmbedInfo } from "../../types";

export const indexBonus = (path: string): number => {
    return /index\.html$/.test(path) ? 2 : 0;
};

export interface IHTMLConfigureResult {
    gamePath: string;
    windowSize: {
        width: number
        height: number
        fullscreen: boolean,
    };
}

interface IDepthMap {
    [key: string]: number;
}

const self = {
    sortEntryPoints: function(paths: string[]) {
        const original = uniq(clone(paths));
        const depths: IDepthMap = {};
        for (const p of original) {
            depths[p] = path.normalize(p).split(path.sep).length;
        }

        const sortedByIndex = sortBy(original, (p) => -indexBonus(p));
        const sortedByDepth = sortBy(sortedByIndex, (p) => depths[p]);
        return sortedByDepth;
    },

    getGamePath: async function(cavePath: string): Promise<string> {
        const entryPoints = await sf.glob("**/*.html", { cwd: cavePath });
        const sortedEntryPoints = self.sortEntryPoints(entryPoints);
        return sortedEntryPoints[0];
    },

    configure: async function(game: IGameRecord, cavePath: string): Promise<IHTMLConfigureResult> {
        const gamePath = await self.getGamePath(cavePath);

        const {embed = {} as IGameEmbedInfo} = game;
        const {width = 1280, height = 720, fullscreen = true} = embed;
        log(opts, `Game settings: ${width}x${height}, fullscreen = ${fullscreen}`);

        const windowSize = {
            width, height, fullscreen,
        };
        return { gamePath, windowSize };
    },
};

export default self;
