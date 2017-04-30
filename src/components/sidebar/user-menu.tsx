
import * as React from "react";
import {createSelector} from "reselect";
import {connect, I18nProps} from "../connect";

import {IAppState} from "../../types";

import * as actions from "../../actions";
import {dispatcher} from "../../constants/action-types";

import defaultImages from "../../constants/default-images";

import urls from "../../constants/urls";

import styled from "../styles";
import Filler from "../basics/filler";
import {ItemDiv} from "./item";

import Dropdown, {IDropdownItem} from "./dropdown";
import Icon from "../basics/icon";

const UserMenuContainer = styled(ItemDiv)`
  margin-right: -${props => props.theme.widths.handle};
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 8px;
  min-height: 50px;
  flex-shrink: 0;

  .icon {
    margin: 0;
  }

  img {
    height: 2em;
    width: 2em;
    margin: 0 5px;
    border-radius: 2px;
  }
`;

class UserMenu extends React.Component<IProps & IDerivedProps & I18nProps, void> {
  render () {
    const {viewCreatorProfile, viewCommunityProfile, changeUser,
      navigate, quit, reportIssue,
      openUrl, checkForSelfUpdate} = this.props;

    const items: IDropdownItem[] = [
      {
        icon: "rocket",
        label: ["sidebar.view_creator_profile"],
        onClick: () => viewCreatorProfile({}),
      },
      {
        icon: "fire",
        label: ["sidebar.view_community_profile"],
        onClick: () => viewCommunityProfile({}),
      },
      {
        type: "separator",
      },
      {
        icon: "download",
        label: ["sidebar.downloads"],
        onClick: () => navigate("downloads"),
      },
      {
        icon: "cog",
        label: ["sidebar.preferences"],
        onClick: () => navigate("preferences"),
      },
      {
        type: "separator",
      },
      {
        icon: "repeat",
        label: ["menu.help.check_for_update"],
        onClick: () => checkForSelfUpdate({}),
      },
      {
        icon: "search",
        label: ["menu.help.search_issue"],
        onClick: () => openUrl({url: `${urls.itchRepo}/search?type=Issues`}),
      },
      {
        icon: "bug",
        label: ["menu.help.report_issue"],
        onClick: () => reportIssue({}),
      },
      {
        icon: "lifebuoy",
        label: ["menu.help.help"],
        onClick: () => navigate("url/" + urls.manual),
      },
      {
        type: "separator",
      },
      {
        icon: "shuffle",
        label: ["menu.account.change_user"],
        onClick: () => changeUser({}),
      },
      {
        icon: "exit",
        label: ["menu.file.quit"],
        onClick: () => quit({}),
      },
    ];

    throw new Error(`hello from user-menu!`);
    return <Dropdown items={items} inner={this.me()} updown/>;
  }

  me () {
    const {me} = this.props;
    const {coverUrl = defaultImages.avatar, username, displayName} = me;

    return <UserMenuContainer>
      <img src={coverUrl}/>
      {username || displayName}
      <Filler/>
      <Icon icon="triangle-down" classes={["flipper"]}/>
    </UserMenuContainer>;
  }
}

interface IProps {}

interface IDerivedProps {
  me: ILightUserRecord;

  viewCreatorProfile: typeof actions.viewCreatorProfile;
  viewCommunityProfile: typeof actions.viewCommunityProfile;
  changeUser: typeof actions.changeUser;
  navigate: typeof actions.navigate;
  quit: typeof actions.quit;
  reportIssue: typeof actions.reportIssue;
  openUrl: typeof actions.openUrl;
  checkForSelfUpdate: typeof actions.checkForSelfUpdate;
}

interface ILightUserRecord {
  displayName?: string;
  username: string;
  coverUrl: string;
}

export default connect<IProps>(UserMenu, {
  state: () => {
    const userDefaults: ILightUserRecord = {
      username: "",
      coverUrl: defaultImages.avatar,
    };

    const getMe = (state: IAppState): ILightUserRecord => state.session.credentials.me;

    return createSelector(
      getMe,
      (me) => {
        return {
          me: { ...userDefaults, ...me },
        };
      },
    );
  },
  dispatch: (dispatch) => ({
    viewCreatorProfile: dispatcher(dispatch, actions.viewCreatorProfile),
    viewCommunityProfile: dispatcher(dispatch, actions.viewCommunityProfile),
    changeUser: dispatcher(dispatch, actions.changeUser),
    navigate: dispatcher(dispatch, actions.navigate),
    quit: dispatcher(dispatch, actions.quit),
    reportIssue: dispatcher(dispatch, actions.reportIssue),
    openUrl: dispatcher(dispatch, actions.openUrl),
    checkForSelfUpdate: dispatcher(dispatch, actions.checkForSelfUpdate),
  }),
});
