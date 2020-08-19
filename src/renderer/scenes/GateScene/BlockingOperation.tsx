import { actions } from "common/actions";
import urls from "common/constants/urls";
import { fileSize } from "common/format/filesize";
import { Dispatch, SetupOperation } from "common/types";
import React from "react";
import Button from "renderer/basics/Button";
import Icon from "renderer/basics/Icon";
import Link from "renderer/basics/Link";
import LoadingCircle from "renderer/basics/LoadingCircle";
import { hook } from "renderer/hocs/hook";
import styled from "renderer/styles";
import { T } from "renderer/t";
import DownloadProgressSpan from "renderer/basics/DownloadProgressSpan";
import { modals } from "common/modals";
import { ambientWind } from "common/util/navigation";

const BlockingOperationDiv = styled.div`
  font-size: ${(props) => props.theme.fontSizes.large};

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
    font-size: ${(props) => props.theme.fontSizes.smaller};
    color: ${(props) => props.theme.secondaryText};
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

class BlockingOperation extends React.PureComponent<Props> {
  render() {
    const { dispatch, blockingOperation, windows } = this.props;

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
          {T(message)}
        </div>
        {!!progressInfo && progressInfo.doneBytes > 0 ? (
          <div className="progress">
            {fileSize(progressInfo.doneBytes)} /{" "}
            {fileSize(progressInfo.totalBytes)}
            {bps !== 0 || eta !== 0 ? (
              <>
                {" @ "}
                <DownloadProgressSpan
                  eta={eta}
                  bps={bps}
                  downloadsPaused={false}
                />
              </>
            ) : null}
          </div>
        ) : null}
        {hasError ? (
          <>
            <div className="error-actions">
              <Button
                icon="repeat"
                label={T(["login.action.retry_setup"])}
                onClick={this.onRetrySetup}
              />
              <Spacer />
              <Button
                icon="bug"
                label={T(["grid.item.open_debug_log"])}
                onClick={this.viewBlockingOperationLog}
              />
            </div>
            {windows ? (
              <p className="antivirus-message">
                <Icon icon="lifebuoy" />
                <Spacer />
                {T(["login.status.antivirus_warning"])}
                <Spacer />
                <Link
                  label={T(["toast.actions.learn_more"])}
                  onClick={this.learnAboutAntivirus}
                />
              </p>
            ) : null}
          </>
        ) : null}
      </BlockingOperationDiv>
    );
  }

  viewBlockingOperationLog = () => {
    const { dispatch, blockingOperation } = this.props;
    dispatch(
      actions.openModal(
        modals.showError.make({
          wind: ambientWind(),
          title: "Setup",
          message: ["login.status.setup_failure", { error: "" }],
          widgetParams: {
            rawError: blockingOperation.rawError,
            log: blockingOperation.log,
            forceDetails: true,
            showSendReport: true,
          },
          buttons: ["ok"],
        })
      )
    );
  };

  onRetrySetup = () => {
    const { dispatch } = this.props;
    dispatch(actions.retrySetup({}));
  };

  learnAboutAntivirus = () => {
    const { dispatch } = this.props;
    dispatch(actions.openInExternalBrowser({ url: urls.windowsAntivirus }));
  };
}

// props

interface Props {
  blockingOperation: SetupOperation;
  windows: boolean;
  dispatch: Dispatch;
}

export default hook((map) => ({
  windows: map((rs) => rs.system.windows),
}))(BlockingOperation);
