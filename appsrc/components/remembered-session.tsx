
import * as React from "react";
import {connect, I18nProps} from "./connect";

import NiceAgo from "./nice-ago";

import defaultImages from "../constants/default-images";

import * as actions from "../actions";

import {IRememberedSession} from "../types";
import {dispatcher} from "../constants/action-types";

export class RememberedSession extends React.Component<IProps & IDerivedProps & I18nProps, void> {
  render () {
    const {t, session, loginWithToken, forgetSessionRequest} = this.props;
    const {me, key} = session;
    const {id, username, displayName, coverUrl = defaultImages.avatar} = me;

    const onForget = (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      forgetSessionRequest({id, username});
    };

    return <div className="remembered-session" onClick={() => {
        const payload = {username, key, me};
        if (this.props.onLogin) {
          this.props.onLogin(payload);
        }
        loginWithToken(payload);
      }}>
      <img className="avatar" src={coverUrl}/>
      <div className="rest">
        <p className="username">{displayName || username}</p>
        <p className="last-connected">
          {t("login.remembered_session.last_connected")} <NiceAgo date={session.lastConnected}/>
        </p>
      </div>
      <div className="filler"/>
      <span data-rh-at="left" data-rh="Forget this session">
        <span className="icon icon-cross forget-session" onClick={onForget}/>
      </span>
    </div>;
  }
}

interface IProps {
  session: IRememberedSession;
  onLogin?: typeof actions.loginWithToken;
}

interface IDerivedProps {
  loginWithToken: typeof actions.loginWithToken;
  forgetSessionRequest: typeof actions.forgetSessionRequest;
}

export default connect<IProps>(RememberedSession, {
  dispatch: (dispatch) => ({
    loginWithToken: dispatcher(dispatch, actions.loginWithToken),
    forgetSessionRequest: dispatcher(dispatch, actions.forgetSessionRequest),
  }),
});
