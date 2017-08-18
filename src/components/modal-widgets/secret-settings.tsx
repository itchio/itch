import * as React from "react";
import { connect } from "../connect";

import { IModalWidgetProps, ModalWidgetDiv } from "./modal-widget";

import { IAppState } from "../../types/index";
import * as actions from "../../actions";
import { dispatcher } from "../../constants/action-types";

export class ExploreJson extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { status } = this.props;

    return (
      <ModalWidgetDiv>
        <label>
          <input
            type="checkbox"
            value="Redux logging"
            checked={status.reduxLoggingEnabled}
            onChange={this.toggleReduxLogging}
          />
          <span>Enable redux logging</span>
        </label>
      </ModalWidgetDiv>
    );
  }

  toggleReduxLogging = () => {
    this.props.setReduxLoggingEnabled({
      enabled: !this.props.status.reduxLoggingEnabled,
    });
  };
}

export interface IExploreJsonParams {
  data: any;
}

interface IProps extends IModalWidgetProps {
  params: IExploreJsonParams;
}

interface IDerivedProps {
  status: IAppState["status"];

  setReduxLoggingEnabled: typeof actions.setReduxLoggingEnabled;
}

export default connect<IProps>(ExploreJson, {
  state: (state: IAppState) => ({
    status: state.status,
  }),
  dispatch: dispatch => ({
    setReduxLoggingEnabled: dispatcher(
      dispatch,
      actions.setReduxLoggingEnabled,
    ),
  }),
});
