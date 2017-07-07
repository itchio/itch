import * as React from "react";
import { connect } from "../connect";

import { IModalWidgetProps, ModalWidgetDiv } from "./modal-widget";

import { ICave } from "../../db/models/cave";

import format from "../format";

export class RevertCave extends React.PureComponent<IProps & IDerivedProps> {
  refs: {
    buildId?: HTMLInputElement;
  };

  constructor() {
    super();
  }

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

interface IDerivedProps {}

export default connect<IProps>(RevertCave);
