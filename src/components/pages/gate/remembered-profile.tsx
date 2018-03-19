import * as React from "react";
import { connect, Dispatchers, actionCreatorsList } from "../../connect";

import TimeAgo from "../../basics/time-ago";
import IconButton from "../../basics/icon-button";

import defaultImages from "../../../constants/default-images";

import { call, messages } from "../../../buse";
import { Profile } from "../../../buse/messages";

import styled from "../../styles";

import format from "../../format";
import { modalWidgets } from "../../modal-widgets";
import { actions } from "../../../actions";
import watching, { Watcher } from "../../watching";

@watching
class RememberedProfile extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { profile } = this.props;
    const { user } = profile;
    const { username, displayName, coverUrl = defaultImages.avatar } = user;

    return (
      <RememberedProfileDiv
        className="remembered-profile"
        onClick={() => {
          this.props.useSavedLogin({ profile });
        }}
      >
        <img className="avatar" src={coverUrl} />
        <div className="rest">
          <p className="username">{displayName || username}</p>
          <p className="last-connected">
            {format(["login.remembered_session.last_connected"])}{" "}
            <TimeAgo date={profile.lastConnected} />
          </p>
        </div>
        <div className="filler" />
        <span
          data-rh-at="left"
          data-rh={JSON.stringify(["prompt.forget_session.action"])}
        >
          <IconButton
            icon="cross"
            className="forget-profile"
            onClick={this.onForget}
          />
        </span>
      </RememberedProfileDiv>
    );
  }

  subscribe(watcher: Watcher) {
    watcher.on(actions.forgetProfile, async (store, action) => {
      const { profile } = action.payload;
      await call(messages.ProfileForget, { profileId: profile.id });
      store.dispatch(actions.profilesUpdated({}));
    });
  }

  onForget = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    const { profile } = this.props;
    const { username } = profile.user;

    this.props.openModal(
      modalWidgets.naked.make({
        title: ["prompt.forget_session.title"],
        message: ["prompt.forget_session.message", { username }],
        detail: ["prompt.forget_session.detail"],
        buttons: [
          {
            id: "modal-forget-profile",
            label: ["prompt.forget_session.action"],
            action: actions.forgetProfile({ profile }),
            icon: "cross",
          },
          "cancel",
        ],
        widgetParams: null,
      })
    );
  };
}

interface IProps {
  profile: Profile;
}

const actionCreators = actionCreatorsList("openModal", "useSavedLogin");

type IDerivedProps = Dispatchers<typeof actionCreators>;

export default connect<IProps>(RememberedProfile, { actionCreators });

const RememberedProfileDiv = styled.div`
  flex-shrink: 0;
  min-width: 380px;
  border-radius: 2px;
  background: ${props => props.theme.sidebarBackground};
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 8px 4px;

  .avatar {
    filter: grayscale(100%);

    width: 64px;
    height: 64px;
    border-radius: 2px;
    margin-right: 4px;
  }

  &:hover .avatar {
    filter: grayscale(0%);
  }

  p {
    padding: 2px 0;
  }

  .rest {
    padding: 6px 8px;
  }

  .filler {
    flex-grow: 8;
  }

  .username {
    color: ${props => props.theme.baseText};
    font-size: ${props => props.theme.fontSizes.huge};
    font-weight: bold;
    padding: 4px 0;
  }

  .last-connected {
    color: ${props => props.theme.secondaryText};
    font-size: 14px;
  }

  box-shadow: 0 0 4px ${props => props.theme.sidebarBackground};

  &:hover {
    box-shadow: 0 0 8px ${props => props.theme.sidebarBackground};
    cursor: pointer;
  }

  &:active {
    -webkit-filter: brightness(70%);
  }
`;
