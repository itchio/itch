import { darken, transparentize } from "polished";
import React, { useState } from "react";
import * as messages from "common/butlerd/messages";
import { PublishChannel } from "common/butlerd/messages";
import ErrorState from "renderer/basics/ErrorState";
import LoadingState from "renderer/basics/LoadingState";
import { useButlerd } from "renderer/hooks/useButlerd";
import styled, * as styles from "renderer/styles";
import { T, _ } from "renderer/t";

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

const ChannelRow = styled.button`
  ${styles.resetButton};
  text-align: left;
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  /* Extra left padding leaves room for the accent bar on the active row
   *  without shifting text when toggling between rows. */
  padding: 8px 12px 8px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: background 0.12s;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: transparent;
    transition: background 0.12s;
  }

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  /* Inset the global focus ring so it doesn't get clipped by the rounded
   *  Wrapper border. (Color/width come from the global focus style.) */
  &:focus-visible {
    outline-offset: -2px;
  }

  &.active {
    background: ${(props) =>
      transparentize(0.82, darken(0.25, props.theme.accent))};

    &::before {
      background: ${(props) => props.theme.accent};
    }
  }

  &.active:hover {
    background: ${(props) =>
      transparentize(0.76, darken(0.25, props.theme.accent))};
  }
`;

const ChannelName = styled.div`
  flex: 1;
  font-weight: bold;
  color: ${(props) => props.theme.secondaryText};

  .active & {
    color: ${(props) => props.theme.baseText};
  }
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

function channelHeadLabel(ch: PublishChannel): string {
  const b = ch.head;
  if (!b) return "no builds yet";
  const v = b.userVersion?.trim();
  if (v) return v;
  if (b.version) return `v${b.version}`;
  return `build #${b.id}`;
}

interface ChannelsProps {
  target: string;
  profileId: number;
  selectedChannel: string | null;
  onPick: (channel: string) => void;
  onExistingChannels?: (names: ReadonlySet<string> | null) => void;
}

const Channels = ({
  target,
  profileId,
  selectedChannel,
  onPick,
  onExistingChannels,
}: ChannelsProps) => {
  const { loading, error, result } = useButlerd(
    messages.PublishListChannels,
    { profileId, target },
    {
      onResult: ({ channels }) => {
        onExistingChannels?.(channels ? new Set(Object.keys(channels)) : null);
      },
    }
  );

  if (loading && !result) {
    return <LoadingState />;
  }
  if (error) {
    return <ErrorState error={error} />;
  }

  const channels: PublishChannel[] = result?.channels
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
          type="button"
          className={selectedChannel === ch.name ? "active" : ""}
          aria-pressed={selectedChannel === ch.name}
          onClick={() => onPick(ch.name)}
        >
          <ChannelName>{ch.name}</ChannelName>
          <ChannelMeta>{channelHeadLabel(ch)}</ChannelMeta>
        </ChannelRow>
      ))}
    </>
  );
};

interface Props {
  /** wharf target ("user/slug"), or null when no game is picked */
  target: string | null;
  profileId: number;
  selectedChannel: string | null;
  onChange: (channel: string | null) => void;
  /** Notifies the parent of the set of channel names that already exist
   *  for this target. The dialog uses this to decide whether the typed
   *  channel is new (and thus eligible for the "hidden on creation"
   *  toggle). null while the list is still loading or unavailable. */
  onExistingChannels?: (names: ReadonlySet<string> | null) => void;
}

const ChannelList = ({
  target,
  profileId,
  selectedChannel,
  onChange,
  onExistingChannels,
}: Props) => {
  const [newChannel, setNewChannel] = useState("");

  if (!target) {
    return null;
  }

  const onPick = (channel: string) => {
    setNewChannel("");
    onChange(channel);
  };

  const onNewChannelChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const v = ev.target.value;
    setNewChannel(v);
    onChange(v.trim() || null);
  };

  return (
    <Wrapper>
      <Header>{T(_("upload.pick_channel"))}</Header>
      <Channels
        key={target}
        target={target}
        profileId={profileId}
        selectedChannel={selectedChannel}
        onPick={onPick}
        onExistingChannels={onExistingChannels}
      />
      <NewChannelRow>
        <NewChannelInput
          type="text"
          placeholder={"+ new channel (e.g. win-64, linux, mac)"}
          value={newChannel}
          onChange={onNewChannelChange}
        />
      </NewChannelRow>
    </Wrapper>
  );
};

export default ChannelList;
