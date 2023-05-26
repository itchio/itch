import { Logger } from "common/logger";
import * as utils from "common/butlerd/utils";
import { createRequest, createNotification } from "butlerd/lib/support";

export type Message =
  | { type: "HOOK_LOGGING"; logger: Logger }
  | { type: "ON_NOTIFICATION"; messageName: string; callback: (any) => void }
  | { type: "ON_REQUEST"; messageName: string; callback: (any) => void };

export const hookLogging = (logger: Logger): Message => {
  return { type: "HOOK_LOGGING", logger: logger };
};

export const onNotification = (
  messageName: string,
  callback: (any) => void
): Message => {
  return {
    type: "ON_NOTIFICATION",
    messageName: messageName,
    callback: callback,
  };
};

export const onRequest = (
  messageName: string,
  callback: (any) => void
): Message => {
  return { type: "ON_REQUEST", messageName: messageName, callback: callback };
};

type SetupFunc = (Conversation) => void;

export const convertMessage = (message: Message): SetupFunc => {
  if (message.type === "HOOK_LOGGING") {
    const logger = new Logger(message.logger.sink, message.logger.name);
    return (convo) => utils.hookLogging(convo, logger);
  } else if (message.type === "ON_NOTIFICATION") {
    const notification = createNotification<any>(message.messageName);
    return (convo) => convo.onNotification(notification, message.callback);
  } else if (message.type === "ON_REQUEST") {
    const request = createRequest<any, any>(message.messageName);
    return (convo) => convo.onRequest(request, message.callback);
  } else {
    return (convo) => null;
  }
};
