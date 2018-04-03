import { asRequestError } from "../butlerd/utils";
import { ILocalizedString } from "../types";

export function formatError(e: Error): ILocalizedString {
  const re = asRequestError(e);
  if (re && re.rpcError) {
    const { code, message } = re.rpcError;
    return [
      `butlerd.codes.${code}`,
      {
        defaultValue: message,
      },
    ];
  }
  return e.message;
}
