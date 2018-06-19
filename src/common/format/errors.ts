import { asRequestError } from "common/butlerd/utils";
import { LocalizedString } from "common/types";
import { RequestError } from "butlerd";
import { Download } from "common/butlerd/messages";

export function formatError(e: Error): LocalizedString {
  const re = asRequestError(e);
  if (re && re.rpcError) {
    const { code, message } = re.rpcError;
    return [
      `butlerd.codes.${code}`,
      {
        defaultValue: `{message}`,
        message,
      },
    ];
  }
  return e.message;
}

export function getDownloadError(item: Download): RequestError {
  let rawError = new Error(item.errorMessage) as RequestError;
  rawError.stack = item.error;
  rawError.rpcError = {
    code: item.errorCode,
    message: item.errorMessage,
    data: {
      stack: item.error,
    },
  };
  return rawError;
}
