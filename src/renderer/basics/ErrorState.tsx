import React from "react";
import styled from "renderer/styles";
import { getRpcErrorData, asRequestError } from "common/butlerd";
import { setFlagsFromString } from "v8";

const Container = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  .spacer {
    width: 8px;
  }

  abbr {
    text-decoration: none;
  }
`;

interface ErrorStateProps {
  error: Error;
}

export const ErrorState = ({ error }: ErrorStateProps) => {
  if (!error) {
    return null;
  }

  return (
    <Container className="error-state">
      <span className="icon icon-error" />
      <div className="spacer" />
      <abbr title={error && error.stack ? error.stack : String(error)}>
        {formatError(error)}
      </abbr>
    </Container>
  );
};

let formatError = (e: Error): string => {
  console.log(`formatting`, e, Object.keys(e));

  let requestError = asRequestError(e);
  if (requestError) {
    const e = requestError.rpcError;
    if (e.data.apiError && e.data.apiError.messages) {
      return e.data.apiError.messages.join(", ");
    }
    return e.message;
  } else {
    return String(e);
  }
};
