import * as React from "react";

import { ModalWidgetDiv } from "./modal-widget";

import styled from "../styles";
import Log from "../basics/log";
import { IModalWidgetProps } from "./index";
import { size } from "underscore";
import { getErrorStack, isInternalError, getRpcErrorData } from "../../butlerd";
import classNames = require("classnames");
import Icon from "../basics/icon";

const StyledLog = styled(Log)`
  tbody {
    min-height: 180px;
  }

  padding-bottom: 1em;
`;

const Pre = styled.pre`
  max-height: 10em;
  overflow-y: scroll;
  background: ${props => props.theme.sidebarBackground};
  padding: 1em;
  line-height: 1.4;
  margin-bottom: 1em;
  white-space: pre-wrap;
`;

const ContainerDiv = styled.div`
  details {
    padding-left: 1em;

    summary {
      margin-left: -1em;
      margin-bottom: 1em;
      padding: 0.2m;

      &:active,
      &:focus {
        outline: 0;
      }

      &:hover {
        cursor: pointer;
      }
    }
  }

  p.butler-version {
    color: ${props => props.theme.secondaryText};
  }
`;

const ReportLabel = styled.label`
  padding: 20px 0;

  display: flex;
  flex-direction: row;
  align-items: center;

  input[type="checkbox"] {
    display: block;
    margin: 0 6px;
  }

  &:hover {
    cursor: pointer;
  }

  transition: color 0.4s;
  &:not(.enabled) {
    color: ${props => props.theme.ternaryText};
  }
`;

class ShowError extends React.PureComponent<IProps, IState> {
  constructor(props: ShowError["props"], context: any) {
    super(props, context);
    this.state = {
      // TODO: save to prefs
      sendReport: true,
    };
  }

  render() {
    const { rawError, log } = this.props.modal.widgetParams;
    const internal = isInternalError(rawError);
    if (!internal) {
      return null;
    }
    const ed = getRpcErrorData(rawError);

    const errorStack = getErrorStack(rawError);
    const errorLines = (errorStack || "Unknown error").split("\n");
    return (
      <ModalWidgetDiv>
        <ContainerDiv>
          <details>
            <summary>View details</summary>
            {size(errorLines) == 1 ? null : (
              <details>
                <summary>{errorLines[0]}</summary>
                <Pre>{errorLines.slice(1).join("\n")}</Pre>
              </details>
            )}
            <details open>
              <summary>Debug log</summary>
              <StyledLog log={log} />
              {ed && ed.butlerVersion ? (
                <p className="butler-version">
                  butler version: {ed.butlerVersion}
                </p>
              ) : null}
            </details>
          </details>
        </ContainerDiv>
        <ReportLabel className={classNames({ enabled: this.state.sendReport })}>
          <input
            type="checkbox"
            checked={this.state.sendReport}
            onChange={this.onSendReportChange}
          />
          Send a report to help resolve this issue &nbsp;
          {this.state.sendReport ? (
            <Icon icon="heart-filled" />
          ) : (
            <Icon icon="heart-broken" />
          )}
        </ReportLabel>
      </ModalWidgetDiv>
    );
  }

  onSendReportChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      sendReport: ev.currentTarget.checked,
    });
  };
}

export interface IShowErrorParams {
  rawError: any;
  log: string;
}

interface IProps extends IModalWidgetProps<IShowErrorParams, void> {}

interface IState {
  sendReport: boolean;
}

export default ShowError;
