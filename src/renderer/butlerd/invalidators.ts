import { RequestCreator } from "butlerd";
import { actions, ActionCreator } from "common/actions";
import { messages } from "common/butlerd";

type MessageType = RequestCreator<any, any>;
export type ActionList = ActionCreator<any>[];

export const invalidators = new Map<MessageType, ActionList>();

invalidators.set(messages.FetchProfileOwnedKeys, [actions.commonsUpdated]);
invalidators.set(messages.FetchCaves, [actions.commonsUpdated]);
invalidators.set(messages.FetchCave, [actions.commonsUpdated]);
invalidators.set(messages.InstallLocationsList, [
  actions.commonsUpdated,
  actions.installLocationsChanged,
]);
