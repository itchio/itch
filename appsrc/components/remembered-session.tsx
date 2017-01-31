
import {connect} from "./connect";
import * as React from "react";

import NiceAgo from "./nice-ago";

import defaultImages from "../constants/default-images";

import * as actions from "../actions";

import {IRememberedSession} from "../types";
import {ILocalizer} from "../localizer";
import {IDispatch, dispatcher} from "../constants/action-types";

export class RememberedSession extends React.Component<IRememberedSessionProps, void> {
  render () {
    const {t, session, loginWithToken, forgetSessionRequest} = this.props;
    const {me, key} = session;
    const {id, username, displayName, coverUrl = defaultImages.avatar} = me;

    const onForget = (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      forgetSessionRequest({id, username});
    };

    return <div className="remembered-session" onClick={() => loginWithToken({username, key, me})}>
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

interface IRememberedSessionProps {
  session: IRememberedSession;

  loginWithToken: typeof actions.loginWithToken;
  forgetSessionRequest: typeof actions.forgetSessionRequest;

  t: ILocalizer;
}

const mapStateToProps = () => ({});

const mapDispatchToProps = (dispatch: IDispatch) => ({
  loginWithToken: dispatcher(dispatch, actions.loginWithToken),
  forgetSessionRequest: dispatcher(dispatch, actions.forgetSessionRequest),
});

export default connect(mapStateToProps, mapDispatchToProps)(RememberedSession);
