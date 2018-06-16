import React from "react";
import { InjectedIntl, injectIntl } from "react-intl";
import { ModalWidgetDiv } from "renderer/modal-widgets/styles";
import { T, TString } from "renderer/t";
import { IModalWidgetProps } from "./index";

class TwoFactorInput extends React.PureComponent<Props & DerivedProps> {
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

export interface ITwoFactorInputParams {
  username: string;
}

export interface ITwoFactorInputResponse {
  /** two-factor authentication code entered */
  totpCode?: string;
}

interface Props
  extends IModalWidgetProps<ITwoFactorInputParams, ITwoFactorInputResponse> {
  params: ITwoFactorInputParams;
}

interface DerivedProps {
  intl: InjectedIntl;
}

export default injectIntl(TwoFactorInput);
