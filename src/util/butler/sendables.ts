import { IGame } from "../../db/models/game";
import { IGameCredentials } from "../../types/index";

export interface IButlerSender {
  send(s: IButlerSendable);
}

export interface IButlerSendable {}

export enum CaveOperation {
  Install = "install",
}

export interface ICaveCommand extends IButlerSendable {
  type: "cave-command";
  operation: CaveOperation;
  installParams?: ICaveInstallParams;
}

export interface ICaveInstallParams {
  game: IGame;
  installFolder: string;
  stageFolder: string;
  credentials: IGameCredentials;
}
