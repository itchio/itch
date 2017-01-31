
import * as React from "react";
import {connect} from "./connect";
import {createSelector} from "reselect";

import {IState} from "../types";

import * as actions from "../actions";
import {dispatcher, IDispatch} from "../constants/action-types";

import defaultImages from "../constants/default-images";

import Dropdown from "./dropdown";
import Icon from "./icon";

import urls from "../constants/urls";

class UserMenu extends React.Component<IUserMenuProps, void> {
  render () {
    const {viewCreatorProfile, viewCommunityProfile, changeUser,
      navigate, quit, reportIssue,
      openUrl, checkForSelfUpdate} = this.props;

    const items = [
      {
        icon: "rocket",
        label: ["sidebar.view_creator_profile"],
        onClick: viewCreatorProfile,
      },
      {
        icon: "fire",
        label: ["sidebar.view_community_profile"],
        onClick: viewCommunityProfile,
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
        onClick: changeUser,
      },
      {
        icon: "exit",
        label: ["menu.file.quit"],
        onClick: quit,
      },
    ];
    return <Dropdown items={items} inner={this.me()} updown/>;
  }

  me () {
    const {me} = this.props;
    const {coverUrl = defaultImages.avatar, username, displayName} = me;

    return <section className="hub-sidebar-item me">
      <img src={coverUrl}/>
      <span className="label">{username || displayName}</span>
      <div className="filler"/>
      <Icon icon="triangle-down" classes={["me-dropdown"]}/>
    </section>;
  }
}

interface IUserMenuProps {
  // derived
  me: ILightUserRecord;

  // actions
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

const mapStateToProps = () => {
  const userDefaults: ILightUserRecord = {
    username: "",
    coverUrl: defaultImages.avatar,
  };

  const getMe = (state: IState): ILightUserRecord => state.session.credentials.me;

  return createSelector(
    getMe,
    (me) => {
      return {
        me: { ...userDefaults, ...me },
      };
    },
  );
};

const mapDispatchToProps = (dispatch: IDispatch) => ({
  viewCreatorProfile: dispatcher(dispatch, actions.viewCreatorProfile),
  viewCommunityProfile: dispatcher(dispatch, actions.viewCommunityProfile),
  changeUser: dispatcher(dispatch, actions.changeUser),
  navigate: dispatcher(dispatch, actions.navigate),
  quit: dispatcher(dispatch, actions.quit),
  reportIssue: dispatcher(dispatch, actions.reportIssue),
  openUrl: dispatcher(dispatch, actions.openUrl),
  checkForSelfUpdate: dispatcher(dispatch, actions.checkForSelfUpdate),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(UserMenu);
