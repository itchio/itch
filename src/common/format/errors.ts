import { asError, asRequestError } from "common/butlerd/errors";
import { LocalizedString } from "common/types";
import { RequestError } from "@itchio/butlerd";
import { Download, InstallPlanInfo } from "common/butlerd/messages";
import { first } from "underscore";

export function formatError(
  e: unknown,
  apiErrorPrefix?: string
): LocalizedString {
  const re = asRequestError(e);
  if (re && re.rpcError) {
    const { code, data } = re.rpcError;
    if (data && data.apiError && apiErrorPrefix) {
      const { messages } = data.apiError;
      const message = first(messages) as string;
      if (message) {
        const snakeCaseMessage = message.replace(/\s/g, "_").toLowerCase();
        return [
          `errors.api.${apiErrorPrefix}.${snakeCaseMessage}`,
          {
            defaultValue: `{message}`,
            message,
          },
        ];
      }
    }

    const { message } = re.rpcError;
    return [
      `butlerd.codes.${code}`,
      {
        defaultValue: `{message}`,
        message,
      },
    ];
  }
  return asError(e).message;
}

export function getDownloadError(item: Download): RequestError | null {
  return getButlerdErrorFromTuple(item);
}

export function getInstallPlanInfoError(
  item: InstallPlanInfo
): RequestError | null {
  return getButlerdErrorFromTuple(item);
}

interface ButlerdErrorTuple {
  error: string;
  errorMessage: string;
  errorCode: number;
}

export function getButlerdErrorFromTuple(
  item: ButlerdErrorTuple
): RequestError | null {
  if (!item.errorMessage) {
    return null;
  }

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
