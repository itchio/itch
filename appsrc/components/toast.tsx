
import * as React from "react";
import {connect} from "./connect";

import * as actions from "../actions";

import Icon from "./icon";

import {ILocalizer} from "../localizer";
import {IDispatch, dispatcher} from "../constants/action-types";

/**
 * Unapologetically and heavily inspired from Google Chrome's "stuff went wrong" tab
 */
export class Toast extends React.Component<IToastProps, IToastState> {
  constructor () {
    super();
    this.state = {
      expanded: false,
    };

    this.toggleExpand = this.toggleExpand.bind(this);
    this.sendFeedback = this.sendFeedback.bind(this);
    this.reload = this.reload.bind(this);
  }

  toggleExpand () {
    this.setState({
      expanded: !this.state.expanded,
    });
  }

  sendFeedback () {
    const {reportIssue, data} = this.props;
    const {error, stack} = data;

    reportIssue({log: error + "\n\nstack:\n" + stack});
  }

  reload () {
    const {evolveTab, data, tabId} = this.props;
    const {path} = data;
    const untoastedPath = path.replace(/^toast\//, "");

    evolveTab({id: tabId, path: untoastedPath, quick: true});
  }

  render () {
    const {t, data = {}} = this.props;

    return <div className="toast-meat">
      <Icon icon="heart-broken" classes={["leader"]}/>
      <h2>{t("toast.title")}</h2>

      <p>{t("toast.message")} {t("toast.call_to_action")}</p>

      <div className="button" onClick={() => this.reload()}>
        <Icon icon="repeat"/> {t("toast.actions.reload")}
      </div>

      <span className="link" onClick={() => this.toggleExpand()}>{t("toast.actions.learn_more")}</span>

      {this.state.expanded
      ? <p className="error">{data.error}</p>
      : ""}

      <span className="link" onClick={() => this.sendFeedback()}>{t("toast.actions.report")}</span>
    </div>;
  }
}

interface IToastState {
  expanded: boolean;
}

interface IToastProps {
  t: ILocalizer;
  data: {
    path?: string;
    error?: string;
    stack?: string;
  };
  tabId: string;

  evolveTab: typeof actions.evolveTab;
  reportIssue: typeof actions.reportIssue;
}

const mapStateToProps = () => ({});

const mapDispatchToProps = (dispatch: IDispatch) => ({
  evolveTab: dispatcher(dispatch, actions.evolveTab),
  reportIssue: dispatcher(dispatch, actions.reportIssue),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Toast);
