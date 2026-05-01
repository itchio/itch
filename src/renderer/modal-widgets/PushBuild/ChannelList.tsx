import React from "react";
import * as messages from "common/butlerd/messages";
import { WharfChannel } from "common/butlerd/messages";
import butlerCaller from "renderer/hocs/butlerCaller";
import styled from "renderer/styles";
import { T, _ } from "renderer/t";

const FetchChannels = butlerCaller(messages.WharfListChannels);

const Wrapper = styled.div`
  margin: 16px 0;
  border: 1px solid ${(props) => props.theme.inputBorder};
  border-radius: 3px;
  background: ${(props) => props.theme.itemBackground};
`;

const Header = styled.div`
  padding: 8px 12px;
  border-bottom: 1px solid ${(props) => props.theme.inputBorder};
  color: ${(props) => props.theme.secondaryText};
  font-size: ${(props) => props.theme.fontSizes.baseText};
`;

const ChannelRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  &:last-child {
    border-bottom: none;
  }

  &.active {
    background: ${(props) => props.theme.sidebarBackground};
  }

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const ChannelName = styled.div`
  flex: 1;
  font-weight: bold;
`;

const ChannelMeta = styled.div`
  color: ${(props) => props.theme.secondaryText};
  font-size: 90%;
`;

const NewChannelRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 8px 12px;
  border-top: 1px solid ${(props) => props.theme.inputBorder};
`;

const NewChannelInput = styled.input`
  flex: 1;
  padding: 6px 8px;
  background: ${(props) => props.theme.inputBackground};
  color: ${(props) => props.theme.baseText};
  border: 1px solid ${(props) => props.theme.inputBorder};
  border-radius: 2px;
  font-family: monospace;
`;

const Empty = styled.div`
  padding: 16px;
  text-align: center;
  color: ${(props) => props.theme.secondaryText};
`;

function channelHeadLabel(ch: WharfChannel): string {
  const b = ch.head;
  if (!b) return "no builds yet";
  const v = b.userVersion?.trim();
  if (v) return v;
  if (b.version) return `v${b.version}`;
  return `build #${b.id}`;
}

interface Props {
  /** wharf target ("user/slug"), or null when no game is picked */
  target: string | null;
  profileId: number;
  selectedChannel: string | null;
  onChange: (channel: string | null) => void;
}

interface State {
  newChannel: string;
}

export default class ChannelList extends React.PureComponent<Props, State> {
  override state: State = { newChannel: "" };

  override render() {
    if (!this.props.target) {
      return null;
    }
    const { target, profileId, selectedChannel } = this.props;
    const { newChannel } = this.state;

    return (
      <Wrapper>
        <Header>{T(_("upload.pick_channel"))}</Header>
        <FetchChannels
          params={{ profileId, target }}
          render={({ result }) => {
            const channels: WharfChannel[] = result?.channels
              ? Object.values(result.channels).sort((a, b) =>
                  a.name.localeCompare(b.name)
                )
              : [];
            if (channels.length === 0) {
              return <Empty>{T(_("upload.no_channels"))}</Empty>;
            }
            return (
              <>
                {channels.map((ch) => (
                  <ChannelRow
                    key={ch.name}
                    className={selectedChannel === ch.name ? "active" : ""}
                    onClick={() => this.handlePick(ch.name)}
                  >
                    <ChannelName>{ch.name}</ChannelName>
                    <ChannelMeta>{channelHeadLabel(ch)}</ChannelMeta>
                  </ChannelRow>
                ))}
              </>
            );
          }}
        />
        <NewChannelRow>
          <NewChannelInput
            type="text"
            placeholder={"+ new channel (e.g. win-64, linux, mac)"}
            value={newChannel}
            onChange={this.handleNewChannelChange}
          />
        </NewChannelRow>
      </Wrapper>
    );
  }

  handlePick = (channel: string) => {
    this.setState({ newChannel: "" });
    this.props.onChange(channel);
  };

  handleNewChannelChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const v = ev.target.value;
    this.setState({ newChannel: v });
    this.props.onChange(v.trim() || null);
  };
}
