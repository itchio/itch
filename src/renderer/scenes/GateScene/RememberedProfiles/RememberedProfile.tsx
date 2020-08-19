import { actions } from "common/actions";
import { Profile } from "common/butlerd/messages";
import React from "react";
import IconButton from "renderer/basics/IconButton";
import TimeAgo from "renderer/basics/TimeAgo";
import { hook } from "renderer/hocs/hook";
import { modals } from "common/modals";
import styled, * as styles from "renderer/styles";
import { T } from "renderer/t";
import { Dispatch } from "common/types";
import { getUserCoverURL } from "common/constants/get-user-cover-url";

class RememberedProfile extends React.PureComponent<Props> {
  render() {
    const { profile } = this.props;
    const { user } = profile;
    const { username, displayName } = user;
    const coverUrl = getUserCoverURL(user);

    return (
      <RememberedProfileDiv
        className="remembered-profile"
        onClick={this.useThisProfile}
      >
        <img className="avatar" src={coverUrl} />
        <div className="rest">
          <p className="username">{displayName || username}</p>
          <p className="last-connected">
            {T(["login.remembered_session.last_connected"])}{" "}
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

  useThisProfile = () => {
    const { dispatch, profile } = this.props;
    dispatch(actions.useSavedLogin({ profile }));
  };

  onForget = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    const { profile, dispatch } = this.props;
    const { username } = profile.user;

    dispatch(
      actions.openModal(
        modals.naked.make({
          wind: "root",
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
      )
    );
  };
}

interface Props {
  profile: Profile;
  dispatch: Dispatch;
}

export default hook()(RememberedProfile);

const RememberedProfileDiv = styled.div`
  ${styles.boxy};
  flex-shrink: 0;
  min-width: 380px;
  border-radius: 2px;
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
    color: ${(props) => props.theme.baseText};
    font-size: ${(props) => props.theme.fontSizes.huge};
    font-weight: bold;
    padding: 4px 0;
  }

  .last-connected {
    color: ${(props) => props.theme.secondaryText};
    font-size: 14px;
  }

  box-shadow: 0 0 4px ${(props) => props.theme.sidebarBackground};

  &:hover {
    box-shadow: 0 0 8px ${(props) => props.theme.sidebarBackground};
    cursor: pointer;
  }

  &:active {
    -webkit-filter: brightness(70%);
  }
`;
