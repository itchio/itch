
import * as React from "react";

import {connect} from "../connect";
import {IModalWidgetProps} from "./modal-widget";

import {ICaveRecord} from "../../types";

import {ILocalizer} from "../../localizer";

export class RevertCave extends React.Component<IRevertCaveProps> {
  refs: {
    buildId?: HTMLInputElement;
  };

  constructor () {
    super();
    this.onChange = this.onChange.bind(this);
  }

  render () {
    const {t} = this.props;
    const params = this.props.modal.widgetParams as IRevertCaveParams;
    const buildId = params.currentCave.buildId;

    return <div className="modal-widget">
      <p>{t("prompt.revert.message", {buildId})}</p>

      <input
        ref="buildId" type="number"
        onKeyDown={this.onChange}
        onKeyUp={this.onChange}
        onChange={this.onChange}
        autoFocus={true}
        />
    </div>;
  }

  onChange () {
    const {buildId} = this.refs;
    if (!buildId) {
      return;
    }

    this.props.updatePayload({
      revertBuildId: parseInt(buildId.value, 10),
    });
  }
}

export interface IRevertCaveParams {
  currentCave: ICaveRecord;
}

interface IRevertCaveProps extends IModalWidgetProps {
  t: ILocalizer;
  params: IRevertCaveParams;
}

const mapStateToProps = () => ({});
const mapDispatchToProps = () => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(RevertCave);
