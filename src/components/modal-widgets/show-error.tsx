import * as React from "react";

import { IModalWidgetProps, ModalWidgetDiv } from "./modal-widget";

import styled from "../styles";
import Log from "../basics/log";

const Pre = styled.pre`
  max-height: 10em;
  overflow-y: scroll;
  background: ${props => props.theme.sidebarBackground};
  padding: 1em;
  line-height: 1.4;
  margin-bottom: 1em;
`;

const ContainerDiv = styled.div`
  details {
    padding-left: 1em;

    summary {
      margin-left: -1em;
      margin-bottom: 1em;
      padding: .2m;

      &:active,
      &:focus {
        outline: 0;
      }

      &:hover {
        cursor: pointer;
      }
    }
  }
`;

export default class ShowError extends React.PureComponent<IProps> {
  render() {
    const { errorStack, log } = this.props.modal
      .widgetParams as IShowErrorParams;

    const errorLines = errorStack.split("\n");
    return (
      <ModalWidgetDiv>
        <ContainerDiv>
          <details>
            <summary>View details</summary>
            <details>
              <summary>
                {errorLines[0]}
              </summary>
              <Pre>
                {errorLines.slice(1).join("\n")}
              </Pre>
            </details>
            <details>
              <summary>Debug log</summary>
              <Log log={log} />
            </details>
          </details>
        </ContainerDiv>
        <label>
          <input type="checkbox" checked />
          Send a report to help resolve this issue
        </label>
      </ModalWidgetDiv>
    );
  }
}

interface IShowErrorParams {
  errorStack: string;
  log: string;
}

interface IProps extends IModalWidgetProps {}
