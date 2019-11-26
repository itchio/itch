import { mainLogger } from "main/logger";
import { Conversation } from "butlerd";

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
      if (convo) {
        logger.debug(`Cancelling downloads convo`);
        convo.cancel();
        this.setPhase(Phase.IDLE);
      } else {
        logger.debug(`Had no downloads convo`);
        this.setPhase(Phase.IDLE);
      }
    } else {
      logger.debug(`Not cancelling, current phase is ${this.phase}`);
    }
  }

  registerConvo(convo: Conversation) {
    this.convo = convo;
    this.setPhase(Phase.RUNNING);
  }

  isConvoCurrent(convo: Conversation) {
    return this.convo === convo;
  }

  setPhase(phase: Phase) {
    logger.debug(`${Phase[this.phase]} => ${Phase[phase]}`);
    this.phase = phase;

    switch (this.phase) {
      case Phase.RUNNING:
        logger.info(`Downloads started`);
        break;
      case Phase.IDLE:
        logger.info(`Downloads stopped`);
        break;
    }
  }

  getPhase() {
    return this.phase;
  }
}

export const state = new State();
