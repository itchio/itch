import { IGameCredentials } from "../types/index";
import { GameCredentials } from "node-buse/lib/messages";
import urls from "../constants/urls";

export function buseGameCredentials(
  credentials: IGameCredentials
): GameCredentials {
  return {
    apiKey: credentials.apiKey,
    downloadKey: credentials.downloadKey ? credentials.downloadKey.id : null,
    server: urls.itchioApi,
  };
}
