import { RecentPushFolder } from "common/types";
import React from "react";
import TimeAgo from "renderer/basics/TimeAgo";
import { hook } from "renderer/hocs/hook";
import styled from "renderer/styles";
import { T, _ } from "renderer/t";

const Wrapper = styled.div`
  margin: 16px 0;
`;

const Header = styled.div`
  color: ${(props) => props.theme.secondaryText};
  text-transform: uppercase;
  font-size: 75%;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
`;

const List = styled.div`
  border: 1px solid ${(props) => props.theme.inputBorder};
  border-radius: 4px;
  overflow: hidden;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 8px 12px;
  background: ${(props) => props.theme.itemBackground};
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;

  &:last-child {
    border-bottom: 0;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.04);
  }

  &.active {
    background: ${(props) => props.theme.sidebarBackground};
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

type Props = OwnProps & MappedProps;

class RecentFolders extends React.PureComponent<Props> {
  override render() {
    const { recentPushFolders, selectedPath } = this.props;
    if (!recentPushFolders || recentPushFolders.length === 0) {
      return null;
    }
    return (
      <Wrapper>
        <Header>{T(_("upload.recent_folders"))}</Header>
        <List>
          {recentPushFolders.map((f) => (
            <Row
              key={f.path}
              className={selectedPath === f.path ? "active" : ""}
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
}

export default hook((map) => ({
  recentPushFolders: map((rs) => rs.preferences.recentPushFolders ?? []),
}))(RecentFolders);
