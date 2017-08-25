import * as React from "react";

import { IModalWidgetProps, ModalWidgetDiv } from "./modal-widget";

import { ICave } from "../../db/models/cave";

import format from "../format";

export default class RevertCave extends React.PureComponent<IProps> {
  refs: {
    buildId?: HTMLInputElement;
  };

  render() {
    const params = this.props.modal.widgetParams as IRevertCaveParams;
    const buildId = params.currentCave.buildId;

    return (
      <ModalWidgetDiv>
        <p>
          {format(["prompt.revert.message", { buildId }])}
        </p>

        <input
          ref="buildId"
          type="number"
          onKeyDown={this.onChange}
          onKeyUp={this.onChange}
          onChange={this.onChange}
          autoFocus={true}
        />
      </ModalWidgetDiv>
    );
  }

  onChange = () => {
    const { buildId } = this.refs;
    if (!buildId) {
      return;
    }

    this.props.updatePayload({
      revertBuildId: parseInt(buildId.value, 10),
    });
  };
}

export interface IRevertCaveParams {
  currentCave: ICave;
}

interface IProps extends IModalWidgetProps {
  params: IRevertCaveParams;
}
