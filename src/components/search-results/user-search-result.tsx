import * as React from "react";
import * as classNames from "classnames";
import GenericSearchResult, {
  searchResultStyle,
} from "./generic-search-result";
import * as actions from "../../actions";

import { IUser } from "../../db/models/user";
import styled from "../styles";

const UserSearchResultDiv = styled.div`
  ${searchResultStyle} img {
    width: 34px;
    height: 34px;
    border-radius: 4px;
  }
`;

class UserSearchResult extends GenericSearchResult<IUserSearchResultProps> {
  render() {
    const { user, onClick, chosen } = this.props;
    const { displayName, username, stillCoverUrl, coverUrl } = user;

    return (
      <UserSearchResultDiv onClick={onClick} className={classNames({ chosen })}>
        <img src={stillCoverUrl || coverUrl} />
        <div className="title-block">
          <h4>
            {displayName || username}
          </h4>
        </div>
      </UserSearchResultDiv>
    );
  }

  getNavigateAction() {
    const { user } = this.props;
    return actions.navigateToUser({ user });
  }
}

interface IUserSearchResultProps {
  user: IUser;
  onClick: () => void;
  chosen: boolean;
  active: boolean;
}

export default UserSearchResult;
