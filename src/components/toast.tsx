import * as React from "react";
import { connect, I18nProps } from "./connect";

import * as actions from "../actions";

import Icon from "./basics/icon";
import { IMeatProps } from "./meats/types";

import { dispatcher } from "../constants/action-types";

/**
 * Unapologetically and heavily inspired from Google Chrome's "stuff went wrong" tab
 */
export class Toast extends React.PureComponent<
  IProps & IDerivedProps & I18nProps,
  IState
> {
  constructor() {
    super();
    this.state = {
      expanded: false,
    };
  }

  toggleExpand = () => {
    this.setState({
      expanded: !this.state.expanded,
    });
  };

  sendFeedback = () => {
    const { reportIssue, tabData } = this.props;
    const { error, stack } = tabData;

    reportIssue({ log: error + "\n\nstack:\n" + stack });
  };

  reload = () => {
    const { evolveTab, tabData, tab } = this.props;
    const { path } = tabData;
    const untoastedPath = path.replace(/^toast\//, "");

    evolveTab({ id: tab, path: untoastedPath, quick: true });
  };

  render() {
    const { t, tabData = {} } = this.props;

    return (
      <div className="toast-meat">
        <Icon icon="heart-broken" className="leader" />
        <h2>{t("toast.title")}</h2>

        <p>{t("toast.message")} {t("toast.call_to_action")}</p>

        <div className="button" onClick={this.reload}>
          <Icon icon="repeat" /> {t("toast.actions.reload")}
        </div>

        <span className="link" onClick={this.toggleExpand}>
          {t("toast.actions.learn_more")}
        </span>

        {this.state.expanded ? <p className="error">{tabData.error}</p> : ""}

        <span className="link" onClick={this.sendFeedback}>
          {t("toast.actions.report")}
        </span>
      </div>
    );
  }
}

interface IProps extends IMeatProps {}

interface IDerivedProps {
  evolveTab: typeof actions.evolveTab;
  reportIssue: typeof actions.reportIssue;
}

interface IState {
  expanded: boolean;
}

export default connect<IProps>(Toast, {
  dispatch: dispatch => ({
    evolveTab: dispatcher(dispatch, actions.evolveTab),
    reportIssue: dispatcher(dispatch, actions.reportIssue),
  }),
});
