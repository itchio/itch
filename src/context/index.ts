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

const cancelPoisonValue = {};

export default class Context {
  private emitter: EventEmitter = new EventEmitter();
  private stoppers: IStopper[] = [];
  private dead = false;
  private cancelPromise: Promise<{}>;
  private resolveCancelPromise: () => void = null;

  constructor(public store: IStore, public db: DB) {
    this.cancelPromise = new Promise((resolve, reject) => {
      this.resolveCancelPromise = resolve;
    });
  }

  /**
   * Try to abort this whole context. If it can't, it'll throw.
   */
  async tryAbort() {
    if (this.dead) {
      return;
    }

    this.resolveCancelPromise();

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
      const result = await Promise.race([opts.work(), this.cancelPromise]);
      if (this.dead || result === cancelPoisonValue) {
        throw new Cancelled();
      }
      return result as T;
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
