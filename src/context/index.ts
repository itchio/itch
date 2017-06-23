import { DB } from "../db";
import { IStore, IProgressInfo, IProgressListener } from "../types";

import { EventEmitter } from "events";
import { Cancelled } from "../tasks/errors";

interface IStopper {
  (): Promise<void>;
}

interface IAbortListener {
  (): void;
}

type Work<T> = () => Promise<T>;

interface IWithStopperOpts<T> {
  stop: IStopper;
  work: Work<T>;
}

export default class Context {
  private emitter: EventEmitter = new EventEmitter();
  private stoppers: IStopper[] = [];
  private dead = false;

  constructor(public store: IStore, public db: DB) {}

  /**
   * Try to abort this whole context. If it can't, it'll throw.
   */
  async tryAbort() {
    if (this.dead) {
      return;
    }

    while (this.stoppers.length > 0) {
      const stopper = this.stoppers.pop();
      await stopper();
    }

    this.dead = true;
    this.emitter.emit("abort");
  }

  /**
   * Do some work that can be cancelled (launching a progress,
   * downloading something, etc.)
   */
  async withStopper<T>(opts: IWithStopperOpts<T>): Promise<T> {
    if (this.dead) {
      throw new Cancelled();
    }

    this.stoppers.push(opts.stop);
    try {
      const result = await opts.work();
      if (this.dead) {
        throw new Cancelled();
      }
      return result;
    } finally {
      this.stoppers = this.stoppers.filter(c => c !== opts.stop);
    }
  }

  on(ev: "abort", listener: IAbortListener);
  on(ev: "progress", listener: IProgressListener);

  on(ev: string, listener: (data: any) => void) {
    this.emitter.on(ev, listener);
  }

  emitProgress(progress: IProgressInfo) {
    this.emitter.emit("progress", progress);
  }

  isDead(): boolean {
    return this.dead;
  }
}
