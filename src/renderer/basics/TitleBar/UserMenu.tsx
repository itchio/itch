import { actions } from "common/actions";
import { User } from "common/butlerd/messages";
import defaultImages from "common/constants/default-images";
import urls from "common/constants/urls";
import { IRootState } from "common/types";
import { rendererWindow } from "common/util/navigation";
import React from "react";
import Filler from "renderer/basics/Filler";
import {
  actionCreatorsList,
  connect,
  Dispatchers,
} from "renderer/hocs/connect";
import styled, * as styles from "renderer/styles";
import { createStructuredSelector } from "reselect";

const UserMenuDiv = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  padding: 8px;
  margin-right: 8px;

  transition: background 0.2s;
  &:hover {
    background: rgba(0, 0, 0, 0.2);
    cursor: pointer;
  }

  .icon {
    margin: 0;
    transition: all 0.2s;
  }

  img {
    height: 24px;
    width: 24px;
    margin-right: 8px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  span {
    flex-shrink: 1;
    ${styles.singleLine()};
  }
`;

class UserMenu extends React.PureComponent<Props & DerivedProps> {
  render() {
    if (!this.props.me) {
      return null; // cf. #1405
    }

    return this.me();
  }

  me() {
    const { me } = this.props;
    const { coverUrl = defaultImages.avatar, username, displayName } = me;

    return (
      <UserMenuDiv className="user-menu" onClick={this.openMenu}>
        <img src={coverUrl} />
        <span>{displayName || username}</span>
        <Filler />
      </UserMenuDiv>
    );
  }

  openMenu = (e: React.MouseEvent<any>) => {
    this.props.popupContextMenu({
      window: rendererWindow(),
      clientX: e.clientX,
      clientY: e.clientY,
      template: [
        {
          icon: "rocket",
          localizedLabel: ["sidebar.view_creator_profile"],
          action: actions.viewCreatorProfile({}),
        },
        {
          icon: "fire",
          localizedLabel: ["sidebar.view_community_profile"],
          action: actions.viewCommunityProfile({}),
        },
        {
          type: "separator",
        },
        {
          icon: "download",
          localizedLabel: ["sidebar.downloads"],
          id: "user-menu-downloads",
          action: actions.navigate({ window: "root", url: "itch://downloads" }),
          accelerator: "CmdOrCtrl+J",
        },
        {
          icon: "cog",
          localizedLabel: ["sidebar.preferences"],
          id: "user-menu-preferences",
          action: actions.navigate({
            window: "root",
            url: "itch://preferences",
          }),
          accelerator: "CmdOrCtrl+,",
        },
        {
          type: "separator",
        },
        {
          icon: "search",
          localizedLabel: ["menu.help.search_issue"],
          action: actions.openInExternalBrowser({
            url: `${urls.itchRepo}/search?type=Issues`,
          }),
        },
        {
          icon: "bug",
          localizedLabel: ["menu.help.report_issue"],
          action: actions.reportIssue({}),
        },
        {
          icon: "newspaper-o",
          localizedLabel: ["menu.help.release_notes"],
          action: actions.viewChangelog({}),
        },
        {
          icon: "lifebuoy",
          localizedLabel: ["menu.help.help"],
          action: actions.navigate({ window: "root", url: urls.manual }),
        },
        {
          type: "separator",
        },
        {
          icon: "shuffle",
          localizedLabel: ["menu.account.change_user"],
          id: "user-menu-change-user",
          action: actions.changeUser({}),
        },
        {
          icon: "exit",
          localizedLabel: ["menu.file.quit"],
          action: actions.quit({}),
          accelerator: "CmdOrCtrl+Q",
        },
      ],
    });
  };
}

interface Props {}

const actionCreators = actionCreatorsList("popupContextMenu");

type DerivedProps = Dispatchers<typeof actionCreators> & {
  me: User;
  displayName?: string;
  username: string;
  coverUrl: string;
};

export default connect<Props>(
  UserMenu,
  {
    state: () =>
      createStructuredSelector({
        me: (rs: IRootState) => rs.profile.profile.user,
      }),
    actionCreators,
  }
);
