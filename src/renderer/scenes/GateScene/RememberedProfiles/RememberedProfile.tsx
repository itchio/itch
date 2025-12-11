import { actions } from "common/actions";
import { Profile } from "common/butlerd/messages";
import React from "react";
import IconButton from "renderer/basics/IconButton";
import TimeAgo from "renderer/basics/TimeAgo";
import { useAppDispatch } from "renderer/hooks/redux";
import modals from "renderer/modals";
import styled, * as styles from "renderer/styles";
import { T } from "renderer/t";
import { getUserCoverURL } from "renderer/util/get-user-cover-url";

interface Props {
  profile: Profile;
}

const RememberedProfile = ({ profile }: Props) => {
  const dispatch = useAppDispatch();
  const { user } = profile;
  const { username, displayName } = user;
  const coverUrl = getUserCoverURL(user);

  const useThisProfile = () => {
    dispatch(actions.useSavedLogin({ profile }));
  };

  const onForget = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

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

  return (
    <RememberedProfileRow className="remembered-profile">
      <RememberedProfileButton onClick={useThisProfile}>
        <img className="avatar" src={coverUrl} />
        <div className="rest">
          <p className="username">{displayName || username}</p>
          <p className="last-connected">
            {T(["login.remembered_session.last_connected"])}{" "}
            <TimeAgo date={profile.lastConnected} />
          </p>
        </div>
      </RememberedProfileButton>
      <ForgetButton
        icon="cross"
        data-rh-at="left"
        data-rh={JSON.stringify(["prompt.forget_session.action"])}
        onClick={onForget}
      />
    </RememberedProfileRow>
  );
};

export default React.memo(RememberedProfile);

const RememberedProfileRow = styled.div`
  ${styles.boxy};
  position: relative;
  flex-shrink: 0;
  min-width: 380px;
  border-radius: 2px;
  box-shadow: 0 0 4px ${(props) => props.theme.sidebarBackground};
  display: flex;
  align-items: center;

  &:hover {
    box-shadow: 0 0 8px ${(props) => props.theme.sidebarBackground};
  }

  &:hover .avatar {
    filter: grayscale(0%);
  }
`;

const RememberedProfileButton = styled.button`
  ${styles.resetButton};
  text-align: left;
  width: 100%;

  display: flex;
  gap: 12px;
  flex-direction: row;
  align-items: center;

  .avatar {
    display: block;
    filter: grayscale(100%);
    width: 64px;
    height: 64px;
    border-radius: 2px;
  }

  p {
    padding: 2px 0;
  }

  .rest {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .username {
    color: ${(props) => props.theme.baseText};
    font-size: ${(props) => props.theme.fontSizes.huge};
    font-weight: bold;
  }

  .last-connected {
    color: ${(props) => props.theme.secondaryText};
    font-size: 14px;
  }

  &:active {
    filter: brightness(70%);
  }
`;

const ForgetButton = styled(IconButton)``;
