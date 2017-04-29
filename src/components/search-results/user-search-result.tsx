
import * as React from "react";
import * as classNames from "classnames";
import GenericSearchResult, {searchResultStyle} from "./generic-search-result";
import * as actions from "../../actions";

import {IUserRecord} from "../../types";
import styled from "../styles";

const UserSearchResultDiv = styled.div`
  ${searchResultStyle}

  img {
    width: 34px;
    height: 34px;
    border-radius: 4px;
  }
`;

class UserSearchResult extends GenericSearchResult<IUserSearchResultProps, void> {
  render () {
    const {user, onClick, chosen} = this.props;
    const {displayName, username, stillCoverUrl, coverUrl} = user;

    return <UserSearchResultDiv onClick={onClick} className={classNames({chosen})}>
      <img src={stillCoverUrl || coverUrl}/>
      <div className="title-block">
        <h4>{displayName || username}</h4>
      </div>
    </UserSearchResultDiv>;
  }

  getNavigateAction() {
    return actions.navigateToUser(this.props.user);
  }
}

interface IUserSearchResultProps {
  user: IUserRecord;
  onClick: () => void;
  chosen: boolean;
  active: boolean;
}

export default UserSearchResult;
