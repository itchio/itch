import * as React from "react";
import { connect } from "./connect";

import * as actions from "../actions";

import Icon from "./basics/icon";
import { IMeatProps } from "./meats/types";

import { dispatcher } from "../constants/action-types";

import format from "./format";

/**
 * Unapologetically and heavily inspired from Google Chrome's "stuff went wrong" tab
 */
export class Toast extends React.PureComponent<IProps & IDerivedProps, IState> {
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
    const { tabData = {} } = this.props;

    return (
      <div className="toast-meat">
        <Icon icon="heart-broken" className="leader" />
        <h2>
          {format(["toast.title"])}
        </h2>

        <p>
          {format(["toast.message"])} {format(["toast.call_to_action"])}
        </p>

        <div className="button" onClick={this.reload}>
          <Icon icon="repeat" /> {format(["toast.actions.reload"])}
        </div>

        <span className="link" onClick={this.toggleExpand}>
          {format(["toast.actions.learn_more"])}
        </span>

        {this.state.expanded
          ? <p className="error">
              {tabData.error}
            </p>
          : ""}

        <span className="link" onClick={this.sendFeedback}>
          {format(["toast.actions.report"])}
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
