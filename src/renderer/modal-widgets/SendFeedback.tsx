import { actions } from "common/actions";
import { fillShape } from "common/format/shape";
import { ModalWidgetProps } from "common/modals";
import { SendFeedbackParams, SendFeedbackResponse } from "common/modals/types";
import { Dispatch, PackagesState } from "common/types";
import { ambientWind } from "common/util/navigation";
import React from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import Button from "renderer/basics/Button";
import Filler from "renderer/basics/Filler";
import LoadingCircle from "renderer/basics/LoadingCircle";
import { doAsync } from "renderer/helpers/doAsync";
import { hook } from "renderer/hocs/hook";
import { ModalWidgetDiv } from "renderer/modal-widgets/styles";
import Label from "renderer/pages/PreferencesPage/Label";
import styled, { css } from "renderer/styles";
import { IntlShape, injectIntl } from "react-intl";
import { T } from "renderer/t";
import { ModalButtons, ModalButtonSpacer } from "renderer/basics/modal-styles";

enum ReportStage {
  Filling,
  Uploading,
  Done,
  Failed,
}

const blockStyle = css`
  margin: 1em 0 0;
  padding: 0.5em;
  font-family: inherit;
  font-size: inherit;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid ${(props) => props.theme.inputBorder};
  color: ${(props) => props.theme.baseText};
  line-height: 1.4;

  width: 100%;
`;

const OurLabel = styled(Label)`
  margin: 1em 0 0;
`;

const MessageArea = styled.textarea`
  ${blockStyle};

  height: 200px;
`;

const InfoBlock = styled.div`
  ${blockStyle};
  width: 100%;
  font-family: inherit;
  font-size: inherit;

  white-space: pre-wrap;
  overflow-y: auto;

  height: 300px;
`;

const CallToAction = styled.div`
  width: 100%;
  height: 250px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  & > :first-child {
    margin-bottom: 1em;
  }
`;

const BigButton = styled(Button)`
  font-size: 150% !important;
`;

const SystemInfo = styled.div`
  em {
    font-weight: lighter;
    color: ${(props) => props.theme.secondaryText};
  }
`;

const SystemBlock = styled.div`
  padding-left: 1em;
`;

const SendFeedbackDiv = styled(ModalWidgetDiv)`
  min-width: 800px;
  max-width: 800px;
  min-height: 600px;
  max-height: 600px;
  display: flex;
  flex-direction: column;

  p {
    line-height: 1.4;
    margin: 1em 0 0;

    ul {
      list-style-type: disc;
      padding-left: 2em;
    }
  }
`;

const ExternalLink = styled.div`
  color: ${(props) => props.theme.secondaryText};
  text-decoration: underline;

  &:hover {
    cursor: pointer;
  }

  &:after {
    content: " ↗";
  }
`;

class ReportIssue extends React.PureComponent<Props, State> {
  constructor(props: ReportIssue["props"], context: any) {
    super(props, context);
    this.state = {
      stage: ReportStage.Filling,
      message: "Dear itch app team, ",
      system: { state: "Loading..." },
      includeSystemInfo: true,
      tabIndex: 0,
    };
  }

  componentDidMount() {
    doAsync(async () => {
      try {
        const sysinfo = await import("systeminformation");
        let output = {
          cpu: "" as any,
          graphics: "" as any,
          osInfo: "" as any,
          broth: "" as any,
        };
        try {
          const input = await sysinfo.cpu();
          output.cpu = fillShape(input, {
            manufacturer: true,
            brand: true,
            vendor: true,
            speed: true,
            cores: true,
          });
        } catch (e) {
          output.cpu = `Could not get info: ${e}`;
        }
        try {
          const input = await sysinfo.graphics();
          output.graphics = fillShape(input, {
            controllers: {
              model: true,
              vendor: true,
              vram: true,
            },
          });
        } catch (e) {
          output.graphics = `Could not get info: ${e}`;
        }
        try {
          const input = await sysinfo.osInfo();
          output.osInfo = fillShape(input, {
            platform: true,
            arch: true,
            distro: true,
            release: true,
            codename: true,
            logofile: true,
          });
        } catch (e) {
          output.osInfo = `Could not get info: ${e}`;
        }

        output.broth = fillShape(this.props.brothPackages, {
          "*": {
            stage: true,
            version: true,
          },
        });
        this.setState({
          system: output,
        });
      } catch (e) {
        this.setState({
          system: { state: `Could not gather system information: ${e.stack}` },
        });
      }
    });
  }

  render() {
    const { stage } = this.state;

    if (stage === ReportStage.Filling) {
      return this.renderFilling();
    } else if (stage === ReportStage.Uploading) {
      return this.renderUploading();
    } else if (stage === ReportStage.Done) {
      return this.renderDone();
    } else {
      return this.renderFailed();
    }
  }

  renderFilling() {
    const { message, system, includeSystemInfo, tabIndex } = this.state;

    return (
      <SendFeedbackDiv>
        <Tabs selectedIndex={tabIndex} onSelect={this.onTabSelected}>
          <TabList>
            <Tab>{T(["send_feedback.steps.your_message"])}</Tab>
            <Tab>{T(["send_feedback.steps.system_info"])}</Tab>
            <Tab>{T(["send_feedback.steps.send"])}</Tab>
          </TabList>

          <TabPanel>
            <p>{T(["send_feedback.describe_issue"])}</p>
            <MessageArea
              autoFocus
              onChange={this.onMessageChange}
              value={message}
            />
            <p>{T(["send_feedback.reminders.header"])}</p>
            <p>
              <ul>
                <li>{T(["send_feedback.reminders.we_are_humans"])}</li>
                <li>{T(["send_feedback.reminders.be_precise"])}</li>
                <li>
                  {T(["send_feedback.reminders.include_reproduce_steps"])}
                </li>
                <li>{T(["send_feedback.reminders.mention_itchio_account"])}</li>
              </ul>
            </p>
            <p>{T(["send_feedback.reminders.thanks"])}</p>
            <p>
              <ExternalLink onClick={this.onLearnMore}>
                {T(["send_feedback.questions.where_does_report_go"])}
              </ExternalLink>
            </p>
          </TabPanel>

          <TabPanel>
            <p>{T(["send_feedback.consent.please_review"])}</p>
            <InfoBlock>
              {includeSystemInfo ? (
                <SystemInfo>{this.renderSystem(system)}</SystemInfo>
              ) : (
                <span>({T(["send_feedback.consent.redacted"])})</span>
              )}
            </InfoBlock>
            <p>{T(["send_feedback.consent.system_info_helps_us"])}</p>
            <OurLabel active={includeSystemInfo}>
              <input
                type="checkbox"
                checked={includeSystemInfo}
                onChange={this.onIncludeSystemInfo}
              />
              <span>{T(["send_feedback.consent.include_in_report"])}</span>
            </OurLabel>
          </TabPanel>

          <TabPanel>
            <p>{T(["send_feedback.send.secret_url"])}</p>
            <p>{T(["send_feedback.send.secret_url.feature_list"])}</p>
            <p>
              <ul>
                <li>
                  {T(["send_feedback.send.secret_url.feature_list.view"])}
                </li>
                <li>
                  {T(["send_feedback.send.secret_url.feature_list.delete"])}
                </li>
              </ul>
            </p>
            <CallToAction>
              <BigButton
                icon={"upload-to-cloud"}
                fat
                wide
                onClick={this.onSend}
              >
                {T(["send_feedback.send.do_send"])}
              </BigButton>
              <ExternalLink onClick={this.onBailOut}>
                {T(["send_feedback.send.dont_send"])}
              </ExternalLink>
            </CallToAction>
            <p>{T(["send_feedback.final_thanks"])}</p>
          </TabPanel>
        </Tabs>
        <Filler />
        <ModalButtons>
          <Button onClick={this.onBailOut}>
            {T(["prompt.action.cancel"])}
          </Button>
          <Filler />
          <Button
            icon={"arrow-left"}
            disabled={tabIndex <= 0}
            onClick={this.onGoBack}
          >
            {T(["send_feedback.nav.previous"])}
          </Button>
          <ModalButtonSpacer />
          <Button
            icon={"arrow-right"}
            disabled={tabIndex >= 2}
            onClick={this.onGoForward}
          >
            {T(["send_feedback.nav.next"])}
          </Button>
        </ModalButtons>
      </SendFeedbackDiv>
    );
  }

  onTabSelected = (tabIndex) => this.setState({ tabIndex });
  onGoBack = () => this.setState((state) => ({ tabIndex: state.tabIndex - 1 }));
  onGoForward = () =>
    this.setState((state) => ({ tabIndex: state.tabIndex + 1 }));
  onIncludeSystemInfo = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ includeSystemInfo: e.currentTarget.checked });
  };

  renderUploading() {
    return (
      <SendFeedbackDiv>
        <CallToAction>
          <LoadingCircle progress={-1} />
          <span>Sending...</span>
        </CallToAction>
      </SendFeedbackDiv>
    );
  }

  renderDone() {
    return (
      <SendFeedbackDiv>
        <p>{T(["send_feedback.success.intro"])}</p>
        <CallToAction>
          <BigButton icon="folder-open" wide fat onClick={this.onViewReport}>
            {T(["send_feedback.success.view_report"])}
          </BigButton>
          <span>{T(["send_feedback.success.view_report.delete"])}</span>
        </CallToAction>
        <p>{T(["send_feedback.success.thanks"])}</p>
        <p>{T(["send_feedback.success.promise"])}</p>
        <Filler />
        <ModalButtons>
          <Button icon={"cross"} onClick={this.onBailOut}>
            {T(["send_feedback.nav.close"])}
          </Button>
        </ModalButtons>
      </SendFeedbackDiv>
    );
  }

  renderFailed() {
    const { errorMessage } = this.state;

    return (
      <SendFeedbackDiv>
        <p>{T(["send_feedback.error.intro"])}</p>
        <InfoBlock>{errorMessage}</InfoBlock>
        <Filler />
        <ModalButtons>
          <Button icon={"cross"} onClick={this.onBailOut}>
            {T(["send_feedback.nav.close"])}
          </Button>
        </ModalButtons>
      </SendFeedbackDiv>
    );
  }

  onViewReport = () => {
    const { dispatch } = this.props;
    const { reportURL } = this.state;
    dispatch(
      actions.openInExternalBrowser({
        url: reportURL,
      })
    );
  };

  onSend = () => {
    this.setState({
      stage: ReportStage.Uploading,
    });

    doAsync(async () => {
      const daleURL = "https://dale.itch.ovh";
      const { system, includeSystemInfo, message } = this.state;
      const { log } = this.props.modal.widgetParams;
      try {
        const params = new URLSearchParams();
        if (includeSystemInfo) {
          params.set("system", JSON.stringify(system, null, 2));
        } else {
          params.set("system", "(redacted)");
        }
        params.set(
          "log",
          `
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
> Message
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

${message}

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
> Log
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

${log}
`
        );
        const body = await fetch(daleURL, {
          method: "post",
          // fetch *can* take a URLSearchParams, thank you very much
          body: params as any,
        });
        if (body.status != 200) {
          throw new Error(
            `Post ${daleURL}: got HTTP ${
              body.status
            }. Body: ${await body.text()}`
          );
        }
        const res = await body.json();
        if (res.success) {
          this.setState({
            stage: ReportStage.Done,
            reportURL: `${daleURL}/${res.id}`,
          });
          return;
        }

        throw new Error(
          `Creating report failed: ${JSON.stringify(res, null, 2)}`
        );
      } catch (e) {
        this.setState({
          stage: ReportStage.Failed,
          errorMessage: e.stack,
        });
      }
    });
  };

  onBailOut = () => {
    const { dispatch } = this.props;
    dispatch(
      actions.closeModal({
        wind: ambientWind(),
        id: this.props.modal.id,
      })
    );
  };

  renderSystem = (input: any): JSX.Element => {
    if (Array.isArray(input)) {
      const arr = input as any[];
      return (
        <>
          {arr.map((x, i) => (
            <SystemBlock key={i}>
              <em>#{i + 1}</em>
              <SystemBlock>{this.renderSystem(x)}</SystemBlock>
            </SystemBlock>
          ))}
        </>
      );
    }

    if (typeof input === "object") {
      return (
        <>
          {Object.keys(input).map((k) => (
            <>
              {!Array.isArray(input[k]) && typeof input[k] !== "object" ? (
                <div>
                  <em>{k}</em> {input[k]}
                </div>
              ) : (
                <div>
                  <em>{k}</em>
                  <SystemBlock>{this.renderSystem(input[k])}</SystemBlock>
                </div>
              )}
            </>
          ))}
        </>
      );
    }

    return <>{input}</>;
  };

  onLearnMore = (ev: React.MouseEvent<any>) => {
    ev.preventDefault();
    const { dispatch } = this.props;
    dispatch(
      actions.openInExternalBrowser({
        url: "https://dale.itch.ovh/",
      })
    );
  };

  onMessageChange = (ev: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textArea = ev.currentTarget;
    this.setState({
      message: textArea.value,
    });
  };
}

interface Props
  extends ModalWidgetProps<SendFeedbackParams, SendFeedbackResponse> {
  intl: IntlShape;
  dispatch: Dispatch;
  brothPackages: PackagesState;
}

interface State {
  stage: ReportStage;
  message: string;
  system: any;
  includeSystemInfo: boolean;
  tabIndex: number;
  reportURL?: string;
  errorMessage?: string;
}

export default injectIntl(
  hook((map) => ({
    brothPackages: map((rs) => rs.broth.packages),
  }))(ReportIssue)
);
