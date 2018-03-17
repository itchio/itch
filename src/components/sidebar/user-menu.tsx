import * as React from "react";
import { createStructuredSelector } from "reselect";
import { connect, Dispatchers, actionCreatorsList } from "../connect";

import { IRootState } from "../../types";

import defaultImages from "../../constants/default-images";

import urls from "../../constants/urls";

import styled, * as styles from "../styles";
import Filler from "../basics/filler";

import { User } from "../../buse/messages";
import { actions } from "../../actions/index";

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

class UserMenu extends React.PureComponent<IProps & IDerivedProps> {
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
          action: actions.navigate({ url: "itch://downloads" }),
          accelerator: "CmdOrCtrl+J",
        },
        {
          icon: "cog",
          localizedLabel: ["sidebar.preferences"],
          id: "user-menu-preferences",
          action: actions.navigate({ url: "itch://preferences" }),
          accelerator: "CmdOrCtrl+,",
        },
        {
          type: "separator",
        },
        {
          icon: "repeat",
          localizedLabel: ["menu.help.check_for_update"],
          action: actions.checkForSelfUpdate({}),
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
          action: actions.navigate({ url: urls.manual }),
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

interface IProps {}

const actionCreators = actionCreatorsList("popupContextMenu");

type IDerivedProps = Dispatchers<typeof actionCreators> & {
  me: User;
  displayName?: string;
  username: string;
  coverUrl: string;
};

export default connect<IProps>(UserMenu, {
  state: () =>
    createStructuredSelector({
      me: (rs: IRootState) => rs.profile.credentials.me,
    }),
  actionCreators,
});
