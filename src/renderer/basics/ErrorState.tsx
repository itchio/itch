import React from "react";
import styled from "renderer/styles";

const ButlerErrorDiv = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  .spacer {
    width: 8px;
  }
`;

const ErrorState = ({ error }) => (
  <ButlerErrorDiv>
    <span className="icon icon-error" />
    <div className="spacer" />
    <abbr title={error && error.stack ? error.stack : String(error)}>
      {String(error)}
    </abbr>
  </ButlerErrorDiv>
);

export default ErrorState;
