import { actions } from "common/actions";
import { fillShape } from "common/format/shape";
import { Dispatch } from "common/types";
import { getRootState } from "common/util/get-root-state";
import { rendererWindow } from "common/util/navigation";
import React from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import Button from "renderer/basics/Button";
import Filler from "renderer/basics/Filler";
import LoadingCircle from "renderer/basics/LoadingCircle";
import { doAsync } from "renderer/helpers/doAsync";
import { withDispatch } from "renderer/hocs/withDispatch";
import { ModalWidgetProps } from "renderer/modal-widgets";
import { ModalWidgetDiv } from "renderer/modal-widgets/styles";
import Label from "renderer/pages/PreferencesPage/Label";
import styled, { css } from "renderer/styles";

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
  border: 1px solid ${props => props.theme.inputBorder};
  color: ${props => props.theme.baseText};
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
    color: ${props => props.theme.secondaryText};
  }
`;

const SystemBlock = styled.div`
  padding-left: 1em;
`;

const ReportIssueDiv = styled(ModalWidgetDiv)`
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
  color: ${props => props.theme.secondaryText};
  text-decoration: underline;

  &:hover {
    cursor: pointer;
  }

  &:after {
    content: " ↗";
  }
`;

const Buttons = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;

  & > * {
    margin-left: 1em;
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

        output.broth = fillShape(getRootState().broth.packages, {
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
      <ReportIssueDiv>
        <Tabs
          selectedIndex={tabIndex}
          onSelect={tabIndex => this.setState({ tabIndex })}
        >
          <TabList>
            <Tab>Your message</Tab>
            <Tab>System information</Tab>
            <Tab>Send report</Tab>
          </TabList>

          <TabPanel>
            <p>
              Please describe what you were trying to do when the issue
              happened:
            </p>
            <MessageArea
              autoFocus
              onChange={this.onMessageChange}
              value={message}
            />
            <p>A few reminders:</p>
            <p>
              <ul>
                <li>Whatever you write will be read by humans.</li>
                <li>
                  Be as precise as you can. We want to address the issue as much
                  as you do!
                </li>
                <li>Include steps to reproduce the issue if you can.</li>
                <li>
                  Mention your itch.io account name and/or the page that was
                  giving you trouble, if relevant.
                </li>
              </ul>
            </p>
            <p>Thanks for sending us feedback!</p>
            <p>
              <ExternalLink onClick={this.onLearnMore}>
                Where does my report go?
              </ExternalLink>
            </p>
          </TabPanel>

          <TabPanel>
            <p>
              Review the information below to make sure you're comfortable with
              it being sent:
            </p>
            <InfoBlock>
              {includeSystemInfo ? (
                <SystemInfo>{this.renderSystem(system)}</SystemInfo>
              ) : (
                "(redacted)"
              )}
            </InfoBlock>
            <p>
              Having a rough idea of your setup often helps us identify the
              source of an issue.
            </p>
            <OurLabel active={includeSystemInfo}>
              <input
                type="checkbox"
                checked={includeSystemInfo}
                onChange={e => {
                  this.setState({ includeSystemInfo: e.currentTarget.checked });
                }}
              />
              <span>Include this information in the report</span>
            </OurLabel>
          </TabPanel>

          <TabPanel>
            <p>A secret URL will be generated for your report.</p>
            <p>From that page, you will be able to:</p>
            <p>
              <ul>
                <li>See everything we see about the report</li>
                <li>Delete it if you decide to.</li>
              </ul>
            </p>
            <CallToAction>
              <BigButton
                icon={"upload-to-cloud"}
                fat
                wide
                onClick={this.onSend}
              >
                Send report
              </BigButton>
              <ExternalLink onClick={this.onBailOut}>
                Nevermind, take me out of here
              </ExternalLink>
            </CallToAction>
            <p>Thank you for sending a report, it helps everyone!</p>
          </TabPanel>
        </Tabs>
        <Filler />
        <Buttons>
          <Button onClick={this.onBailOut}>Cancel</Button>
          <Filler />
          <Button
            icon={"arrow-left"}
            disabled={tabIndex <= 0}
            onClick={() => this.setState({ tabIndex: tabIndex - 1 })}
          >
            Previous
          </Button>
          <Button
            icon={"arrow-right"}
            disabled={tabIndex >= 2}
            onClick={() => this.setState({ tabIndex: tabIndex + 1 })}
          >
            Next
          </Button>
        </Buttons>
      </ReportIssueDiv>
    );
  }

  renderUploading() {
    return (
      <ReportIssueDiv>
        <CallToAction>
          <LoadingCircle progress={-1} />
          <span>Sending...</span>
        </CallToAction>
      </ReportIssueDiv>
    );
  }

  renderDone() {
    return (
      <ReportIssueDiv>
        <p>Your report was sent successfully!</p>
        <CallToAction>
          <BigButton icon="folder-open" wide fat onClick={this.onViewReport}>
            View report
          </BigButton>
          <span>(You can delete it from this page)</span>
        </CallToAction>
        <p>Thanks for your feedback.</p>
        <p>
          It will be reviewed as soon as we can, converted into an actionable
          issue, and hopefully fixed in a future release.
        </p>
        <Filler />
        <Buttons>
          <Button icon={"cross"} onClick={this.onBailOut}>
            Close
          </Button>
        </Buttons>
      </ReportIssueDiv>
    );
  }

  renderFailed() {
    const { errorMessage } = this.state;

    return (
      <ReportIssueDiv>
        <p>Sorry, we could not send your report :(</p>
        <InfoBlock>{errorMessage}</InfoBlock>
        <Filler />
        <Buttons>
          <Button icon={"cross"} onClick={this.onBailOut}>
            Close
          </Button>
        </Buttons>
      </ReportIssueDiv>
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
        window: rendererWindow(),
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
          {Object.keys(input).map(k => (
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

export interface ReportIssueParams {
  log?: string;
}

interface Props extends ModalWidgetProps<ReportIssueParams, void> {
  dispatch: Dispatch;
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

export default withDispatch(ReportIssue);
