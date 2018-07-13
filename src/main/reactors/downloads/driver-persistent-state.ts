import { messages } from "common/butlerd";
import { mainLogger } from "main/logger";
import { mcall } from "main/butlerd/mcall";
import { Conversation } from "../../../../node_modules/butlerd/lib/client";

const logger = mainLogger.child(__filename);

export enum Phase {
  IDLE,
  STARTING,
  RUNNING,
  CANCELLING,
}

class State {
  private phase: Phase;
  private convo: Conversation;

  constructor() {
    this.phase = Phase.IDLE;
  }

  async cancel() {
    if (this.phase === Phase.RUNNING) {
      this.setPhase(Phase.CANCELLING);
      const { convo } = this;
      this.convo = null;
      await convo.cancel();
    }
  }

  registerConvo(convo: Conversation) {
    this.convo = convo;
    this.setPhase(Phase.RUNNING);
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
