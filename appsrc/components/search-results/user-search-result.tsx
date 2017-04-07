
import * as React from "react";
import * as classNames from "classnames";
import GenericSearchResult from "./generic-search-result";

import {IUserRecord} from "../../types";

class UserSearchResult extends GenericSearchResult<IUserSearchResultProps, void> {
  render () {
    const {user, onClick, chosen} = this.props;
    const {displayName, username, stillCoverUrl, coverUrl} = user;

    const resultClasses = classNames("search-result", "user-search-result", {
      chosen,
    });

    return <div className={resultClasses} onClick={onClick}>
      <img src={stillCoverUrl || coverUrl}/>
      <div className="title-block">
        <h4>{displayName || username}</h4>
      </div>
    </div>;
  }

  getPath(): string {
    return `users/${this.props.user.id}`;
  }
}

interface IUserSearchResultProps {
  user: IUserRecord;
  onClick: () => void;
  chosen: boolean;
  active: boolean;
}

export default UserSearchResult;
