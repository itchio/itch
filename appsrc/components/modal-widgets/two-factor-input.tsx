
import * as React from "react";

import {connect} from "../connect";
import {IModalWidgetProps} from "./modal-widget";

export class TwoFactorInput extends React.Component<ITwoFactorInputProps, void> {
  refs: {
    totpInput?: HTMLInputElement;
  };

  constructor () {
    super();
    this.onChange = this.onChange.bind(this);
  }

  render () {
    const params = this.props.modal.widgetParams as ITwoFactorInputParams;

    return <div className="modal-widget">
      <p><strong>Logging in as {params.username}</strong></p>

      <p>Please enter the code shown on your authenticator to continue logging in.</p>

      <input
        placeholder="Verification code"
        ref="totpInput" type="number"
        onKeyDown={this.onChange}
        onKeyUp={this.onChange}
        onChange={this.onChange}
        autoFocus={true}
        />
    </div>;
  }

  onChange () {
    const {totpInput} = this.refs;
    if (!totpInput) {
      return;
    }

    this.props.updatePayload({
      totpCode: totpInput.value,
    });
  }
}

export interface ITwoFactorInputParams {
  username: string;
}

interface ITwoFactorInputProps extends IModalWidgetProps {
  params: ITwoFactorInputParams;
}

const mapStateToProps = () => ({});
const mapDispatchToProps = () => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(TwoFactorInput);
