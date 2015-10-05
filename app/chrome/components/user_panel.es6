
import React from "react";
import classNames from "classnames";

let remote = window.require("remote");

class UserPanel extends React.Component {
  constructor() {
    super();
    this.state = { user: null };
  }

  render() {
    let me = this.props.me;
    let loading = !me;

    return <div className={classNames("user_panel", {loading})}>
      {me ?
        <div>
          <img className="avatar" src={me.cover_url}/>
          <div className="username">{me.username}</div>
        </div>
      :
        "Loading..."
      }
    </div>;
  }
}

export {UserPanel};

