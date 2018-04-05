import React from "react";

import Icon from "../../basics/icon";
import Button from "../../basics/button";
import LoadingCircle from "../../basics/loading-circle";

import format from "../../format";
import styled from "../../styles";

import { connect, Dispatchers, actionCreatorsList } from "../../connect";
import { ISetupOperation, IRootState } from "../../../types";

import { reportIssue } from "../../../util/crash-reporter";
import { fileSize } from "../../../format/filesize";
import { downloadProgress } from "../../../format/download-progress";
import urls from "../../../constants/urls";
import Link from "../../basics/link";

const BlockingOperationDiv = styled.div`
  font-size: ${props => props.theme.fontSizes.large};

  .message {
    padding: 1em;
    display: flex;
    flex-direction: row;
    justify-content: center;
    white-space: pre-wrap;
    max-height: 150px;
    overflow-y: auto;
    user-select: initial;
  }

  .antivirus-message {
    background: rgba(0, 0, 0, 0.3);
    margin: 1em 0;
    padding: 1em;
  }

  .progress {
    padding: 1em;
    font-size: ${props => props.theme.fontSizes.smaller};
    color: ${props => props.theme.secondaryText};
    text-align: center;
  }

  .error-actions {
    padding: 1em;
    display: flex;
    flex-direction: row;
    justify-content: center;
  }
`;

const Spacer = styled.div`
  display: inline-block;
  height: 1px;
  min-width: 8px;
`;

class BlockingOperation extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { retrySetup, blockingOperation, windows } = this.props;

    const { message, icon, progressInfo } = blockingOperation;
    const hasError = icon === "error";
    let iconElement: JSX.Element;
    if (hasError) {
      iconElement = <Icon icon={icon} />;
    } else {
      iconElement = (
        <LoadingCircle
          wide
          progress={progressInfo ? progressInfo.progress : -1}
        />
      );
    }

    const { bps = 0, eta = 0 } = progressInfo ? progressInfo : {};

    return (
      <BlockingOperationDiv>
        <div className="message">
          {iconElement ? (
            <>
              {iconElement}
              <Spacer />
            </>
          ) : null}
          {format(message)}
        </div>
        {!!progressInfo && progressInfo.doneBytes > 0 ? (
          <div className="progress">
            {fileSize(progressInfo.doneBytes)} /{" "}
            {fileSize(progressInfo.totalBytes)}
            {bps !== 0 || eta !== 0 ? (
              <>
                {" @ "}
                {downloadProgress({ eta, bps }, false)}
              </>
            ) : null}
          </div>
        ) : null}
        {hasError ? (
          <>
            <div className="error-actions">
              <Button
                discreet
                icon="repeat"
                label={format(["login.action.retry_setup"])}
                onClick={() => retrySetup({})}
              />
              <Spacer />
              <Button
                discreet
                icon="bug"
                label={format(["grid.item.report_problem"])}
                onClick={() =>
                  reportIssue({
                    type: "Trouble in setup",
                    body: blockingOperation.stack,
                  })
                }
              />
            </div>
            {windows ? (
              <p className="antivirus-message">
                <Icon icon="lifebuoy" />
                <Spacer />
                {format(["login.status.antivirus_warning"])}
                <Spacer />
                <Link
                  label={format(["toast.actions.learn_more"])}
                  onClick={this.learnAboutAntivirus}
                />
              </p>
            ) : null}
          </>
        ) : null}
      </BlockingOperationDiv>
    );
  }

  learnAboutAntivirus = () => {
    this.props.openInExternalBrowser({ url: urls.windowsAntivirus });
  };
}

// props

interface IProps {
  blockingOperation: ISetupOperation;
  windows?: boolean;
}

const actionCreators = actionCreatorsList(
  "retrySetup",
  "openInExternalBrowser"
);

type IDerivedProps = Dispatchers<typeof actionCreators>;

export default connect<IProps>(BlockingOperation, {
  actionCreators,
  state: (rs: IRootState) => ({ windows: rs.system.windows }),
});
