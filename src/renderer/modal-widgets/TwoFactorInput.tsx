import { ModalWidgetProps } from "common/modals";
import {
  TwoFactorInputParams,
  TwoFactorInputResponse,
} from "common/modals/types";
import React from "react";
import { InjectedIntl } from "react-intl";
import { withIntl } from "renderer/hocs/withIntl";
import { ModalWidgetDiv } from "renderer/modal-widgets/styles";
import { T, TString } from "renderer/t";

class TwoFactorInput extends React.PureComponent<Props> {
  refs: {
    totpInput?: HTMLInputElement;
  };

  render() {
    const params = this.props.modal.widgetParams;
    const { username } = params;
    const { intl } = this.props;

    return (
      <ModalWidgetDiv>
        <p>
          <strong>{T(["login.two_factor.as_user", { username }])}</strong>
        </p>

        <p>{T(["login.two_factor.enter_code"])}</p>

        <input
          placeholder={TString(intl, [
            "login.two_factor.verification_code_label",
          ])}
          ref="totpInput"
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
    const { totpInput } = this.refs;
    if (!totpInput) {
      return;
    }

    this.props.updatePayload({
      totpCode: totpInput.value,
    });
  };
}

interface Props
  extends ModalWidgetProps<TwoFactorInputParams, TwoFactorInputResponse> {
  params: TwoFactorInputParams;

  intl: InjectedIntl;
}

export default withIntl(TwoFactorInput);
