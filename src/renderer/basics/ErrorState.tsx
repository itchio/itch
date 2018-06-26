import React from "react";
import styled from "renderer/styles";

const ButlerErrorDiv = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 2em 0;

  .spacer {
    width: 8px;
  }
`;

const ErrorState = ({ error }: { error: Error }) => {
  if (!error) {
    return null;
  }

  return (
    <ButlerErrorDiv>
      <span className="icon icon-error" />
      <div className="spacer" />
      <abbr title={error && error.stack ? error.stack : String(error)}>
        {String(error)}
      </abbr>
    </ButlerErrorDiv>
  );
};

export default ErrorState;
