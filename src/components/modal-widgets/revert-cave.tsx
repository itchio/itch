
import * as React from "react";
import {connect, I18nProps} from "../connect";

import {IModalWidgetProps, ModalWidgetDiv} from "./modal-widget";

import {ICaveRecord} from "../../types";

export class RevertCave extends React.PureComponent<IProps & IDerivedProps & I18nProps, void> {
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

    return <ModalWidgetDiv>
      <p>{t("prompt.revert.message", {buildId})}</p>

      <input
        ref="buildId" type="number"
        onKeyDown={this.onChange}
        onKeyUp={this.onChange}
        onChange={this.onChange}
        autoFocus={true}
        />
    </ModalWidgetDiv>;
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

interface IProps extends IModalWidgetProps {
  params: IRevertCaveParams;
}

interface IDerivedProps {}

export default connect<IProps>(RevertCave);
