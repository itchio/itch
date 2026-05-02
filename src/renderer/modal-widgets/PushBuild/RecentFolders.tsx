import { darken, transparentize } from "polished";
import { actions } from "common/actions";
import { Dispatch, RecentPushFolder } from "common/types";
import React from "react";
import IconButton from "renderer/basics/IconButton";
import TimeAgo from "renderer/basics/TimeAgo";
import { hook } from "renderer/hocs/hook";
import styled, * as styles from "renderer/styles";
import { T, _ } from "renderer/t";

const Wrapper = styled.div`
  margin: 16px 0;
`;

const Header = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  color: ${(props) => props.theme.secondaryText};
  text-transform: uppercase;
  font-size: 75%;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
`;

const HeaderTitle = styled.div`
  flex: 1;
`;

const ClearButton = styled(IconButton)`
  width: 22px;
  height: 22px;
  font-size: ${(props) => props.theme.fontSizes.sidebar};
`;

const List = styled.div`
  border: 1px solid ${(props) => props.theme.inputBorder};
  border-radius: 4px;
  overflow: hidden;
`;

const Row = styled.button`
  ${styles.resetButton};
  text-align: left;
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  /* Match ChannelRow padding so the accent bar can sit at left edge. */
  padding: 8px 12px 8px 16px;
  background: ${(props) => props.theme.itemBackground};
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
    border-bottom: 0;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.04);
  }

  /* List wrapper has overflow:hidden + rounded corners; inset the ring so
   *  it stays visible. (Color/width come from the global focus style.) */
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

const Path = styled.div`
  flex: 1;
  font-family: monospace;
  font-size: 90%;
  color: ${(props) => props.theme.baseText};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 12px;
`;

const When = styled.div`
  color: ${(props) => props.theme.secondaryText};
  font-size: 85%;
  white-space: nowrap;
`;

interface OwnProps {
  selectedPath: string | null;
  onPick: (path: string) => void;
}

interface MappedProps {
  recentPushFolders: RecentPushFolder[];
}

type Props = OwnProps & MappedProps & { dispatch: Dispatch };

class RecentFolders extends React.PureComponent<Props> {
  override render() {
    const { recentPushFolders, selectedPath } = this.props;
    if (!recentPushFolders || recentPushFolders.length === 0) {
      return null;
    }
    return (
      <Wrapper>
        <Header>
          <HeaderTitle>{T(_("upload.recent_folders"))}</HeaderTitle>
          <ClearButton
            icon="delete"
            hint={_("upload.recent_folders.clear")}
            onClick={this.handleClear}
          />
        </Header>
        <List>
          {recentPushFolders.map((f) => (
            <Row
              key={f.path}
              type="button"
              className={selectedPath === f.path ? "active" : ""}
              aria-pressed={selectedPath === f.path}
              onClick={() => this.props.onPick(f.path)}
            >
              <Path>{f.path}</Path>
              <When>
                <TimeAgo date={new Date(f.lastUsedAt)} />
              </When>
            </Row>
          ))}
        </List>
      </Wrapper>
    );
  }

  handleClear = () => {
    this.props.dispatch(actions.updatePreferences({ recentPushFolders: [] }));
  };
}

export default hook((map) => ({
  recentPushFolders: map((rs) => rs.preferences.recentPushFolders ?? []),
}))(RecentFolders);
