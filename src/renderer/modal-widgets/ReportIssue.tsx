import React from "react";
import { ModalWidgetProps } from "renderer/modal-widgets";
import { ModalWidgetDiv } from "renderer/modal-widgets/styles";
import { Title, TitleBox } from "renderer/pages/PageStyles/games";
import styled, { css } from "renderer/styles";
import { doAsync } from "renderer/helpers/doAsync";

const blockStyle = css`
  margin: 1em 0;
  padding: 0.5em;
  width: 100%;
  font-family: inherit;
  font-size: inherit;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid ${props => props.theme.inputBorder};
  color: ${props => props.theme.baseText};
`;

const MessageArea = styled.textarea`
  ${blockStyle};
  min-width: 500px;
  min-height: 200px;
`;

const InfoBlock = styled.div`
  ${blockStyle};
  width: 100%;
  font-family: inherit;
  font-size: inherit;

  white-space: pre-wrap;
  max-height: 6em;
  overflow-y: auto;
`;

class ReportIssue extends React.PureComponent<Props, State> {
  constructor(props: ReportIssue["props"], context: any) {
    super(props, context);
    this.state = {
      message: "Dear itch app team, ",
      system: "Loading...",
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
        };
        try {
          output.cpu = await sysinfo.cpu();
        } catch (e) {
          output.cpu = `Could not get info: ${e}`;
        }
        try {
          output.graphics = await sysinfo.graphics();
        } catch (e) {
          output.graphics = `Could not get info: ${e}`;
        }
        try {
          output.osInfo = await sysinfo.osInfo();
        } catch (e) {
          output.osInfo = `Could not get info: ${e}`;
        }
        this.setState({
          system: JSON.stringify(output, null, 2),
        });
      } catch (e) {
        this.setState({
          system: `Could not gather system information: ${e.stack}`,
        });
      }
    });
  }

  render() {
    const { log } = this.props.modal.widgetParams;
    const { message, system } = this.state;

    return (
      <ModalWidgetDiv>
        <TitleBox>
          <Title>Your message</Title>
        </TitleBox>
        <MessageArea onChange={this.onMessageChange}>{message}</MessageArea>
        <TitleBox>
          <Title>System information</Title>
        </TitleBox>
        <InfoBlock>{system}</InfoBlock>
        <TitleBox>
          <Title>Log</Title>
        </TitleBox>
        <InfoBlock>
          {log}
          {"This is a fake log line....\n"}
          {"This is a fake log line....\n"}
          {"This is a fake log line....\n"}
          {"This is a fake log line....\n"}
          {"This is a fake log line....\n"}
          {"This is a fake log line....\n"}
        </InfoBlock>
      </ModalWidgetDiv>
    );
  }

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

interface Props extends ModalWidgetProps<ReportIssueParams, void> {}

interface State {
  message: string;
  system: string;
}

export default ReportIssue;
