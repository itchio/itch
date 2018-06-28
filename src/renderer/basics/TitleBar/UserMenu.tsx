import { actions } from "common/actions";
import { User } from "common/butlerd/messages";
import defaultImages from "common/constants/default-images";
import urls from "common/constants/urls";
import { Dispatch } from "common/types";
import { ambientWind } from "common/util/navigation";
import React from "react";
import Filler from "renderer/basics/Filler";
import { hook } from "renderer/hocs/hook";
import styled, * as styles from "renderer/styles";

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

class UserMenu extends React.PureComponent<Props> {
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
    const { dispatch } = this.props;
    dispatch(
      actions.popupContextMenu({
        wind: ambientWind(),
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
            action: actions.navigate({
              wind: "root",
              url: "itch://downloads",
            }),
            accelerator: "CmdOrCtrl+J",
          },
          {
            icon: "cog",
            localizedLabel: ["sidebar.preferences"],
            id: "user-menu-preferences",
            action: actions.navigate({
              wind: "root",
              url: "itch://preferences",
            }),
            accelerator: "CmdOrCtrl+,",
          },
          {
            type: "separator",
          },
          {
            icon: "bug",
            localizedLabel: ["menu.help.report_issue"],
            action: actions.reportIssue({}),
          },
          {
            icon: "lifebuoy",
            localizedLabel: ["menu.help.help"],
            action: actions.navigate({ wind: "root", url: urls.manual }),
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
      })
    );
  };
}

interface Props {
  dispatch: Dispatch;
  me: User;
}

export default hook(map => ({
  me: map(rs => rs.profile.profile.user),
}))(UserMenu);
