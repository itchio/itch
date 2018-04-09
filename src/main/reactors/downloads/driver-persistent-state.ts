import { Client } from "butlerd";

import rootLogger from "common/logger";
import { messages } from "common/butlerd";
const logger = rootLogger.child({ name: "download-driver" });

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
