import { asRequestError } from "common/butlerd";
import React, { useState, useEffect } from "react";
import classNames from "classnames";
import styled from "styled-components";
import { mixins } from "renderer/theme";

const Container = styled.div`
  ${mixins.singleLine};

  overflow: hidden;
  transition: all 0.2s ease-out;
  height: 0;

  align-self: stretch;
  border-radius: 2px;
  background-color: ${p => p.theme.colors.errorBg};
  color: ${p => p.theme.colors.errorText};

  padding-left: 1.4em;
  padding-right: 1.4em;
  opacity: 0;

  &.shown {
    padding-top: 1.4em;
    padding-bottom: 1.4em;
    height: 2em;
    opacity: 1;
  }

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
  error?: Error;
  className?: string;
}

export const ErrorState = (props: ErrorStateProps) => {
  const [error, setError] = useState<Error | null>(null);
  const [shown, setShown] = useState(false);

  const propError = props.error;

  useEffect(() => {
    if (propError && error != propError) {
      if (propError) {
        setError(propError);
      }
    }

    setTimeout(() => {
      // use `props` directly to avoid hiding after we
      // already got an error back
      setShown(!!props.error);
    }, 125);
  }, [error, propError]);

  return (
    <Container
      className={classNames("error-state", props.className, { shown })}
    >
      {error ? (
        <>
          <span className="icon icon-error" />
          <div className="spacer" />
          <abbr title={error && error.stack ? error.stack : String(error)}>
            {formatError(error)}
          </abbr>
        </>
      ) : null}
    </Container>
  );
};

let formatError = (e: Error): string => {
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
