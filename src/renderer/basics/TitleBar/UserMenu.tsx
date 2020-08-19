import { actions } from "common/actions";
import { User } from "common/butlerd/messages";
import { Dispatch } from "common/types";
import { ambientWind } from "common/util/navigation";
import React from "react";
import Filler from "renderer/basics/Filler";
import { hook } from "renderer/hocs/hook";
import styled, * as styles from "renderer/styles";
import { getUserCoverURL } from "common/constants/get-user-cover-url";

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

  animation: ${styles.animations.enterTop} 0.2s;

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
    ${styles.singleLine};
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
    const { username, displayName } = me;
    const coverUrl = getUserCoverURL(me);

    return (
      <UserMenuDiv className="user-menu" onMouseDown={this.openMenu}>
        <img src={coverUrl} />
        <span>{displayName || username}</span>
        <Filler />
      </UserMenuDiv>
    );
  }

  openMenu = (e: React.MouseEvent<any>) => {
    if (e.button === 0) {
      const { dispatch } = this.props;
      dispatch(
        actions.openUserMenu({
          wind: ambientWind(),
          clientX: e.clientX,
          clientY: e.clientY,
        })
      );
    }
  };
}

interface Props {
  dispatch: Dispatch;
  me: User;
}

export default hook((map) => ({
  me: map((rs) => rs.profile.profile.user),
}))(UserMenu);
