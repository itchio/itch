import { messages } from "common/butlerd";
import { mainLogger } from "main/logger";
import { mcall } from "main/butlerd/mcall";

const logger = mainLogger.child(__filename);

export enum Phase {
  IDLE,
  STARTING,
  RUNNING,
  CANCELLING,
}

class State {
  private phase: Phase;

  constructor() {
    this.phase = Phase.IDLE;
  }

  async cancel() {
    if (this.phase === Phase.RUNNING) {
      this.setPhase(Phase.CANCELLING);
      await mcall(messages.DownloadsDriveCancel, {});
    }
  }

  setPhase(phase: Phase) {
    logger.info(`${Phase[this.phase]} => ${Phase[phase]}`);
    this.phase = phase;
  }

  getPhase() {
    return this.phase;
  }
}

export const state = new State();
