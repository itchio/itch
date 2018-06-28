import { Client } from "butlerd";
import { messages } from "common/butlerd";
import { mainLogger } from "main/logger";

const logger = mainLogger.child(__filename);

export enum Phase {
  IDLE,
  STARTING,
  RUNNING,
  CANCELLING,
}

class State {
  private client: Client;
  private phase: Phase;

  constructor() {
    this.phase = Phase.IDLE;
  }

  registerClient(client: Client) {
    this.client = client;
    this.setPhase(Phase.RUNNING);
  }

  async cancel() {
    this.setPhase(Phase.CANCELLING);
    await this.client.call(messages.DownloadsDriveCancel, {});
    this.client = null;
  }

  getClient() {
    return this.client;
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
