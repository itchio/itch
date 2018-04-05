import React from "react";

import format, { formatString } from "../format";
import { InjectedIntl, injectIntl } from "react-intl";

import { ModalWidgetDiv } from "./modal-widget";
import { IModalWidgetProps } from "./index";

class TwoFactorInput extends React.PureComponent<IProps & IDerivedProps> {
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
          <strong>{format(["login.two_factor.as_user", { username }])}</strong>
        </p>

        <p>{format(["login.two_factor.enter_code"])}</p>

        <input
          placeholder={formatString(intl, [
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

interface IProps
  extends IModalWidgetProps<ITwoFactorInputParams, ITwoFactorInputResponse> {
  params: ITwoFactorInputParams;
}

interface IDerivedProps {
  intl: InjectedIntl;
}

export default injectIntl(TwoFactorInput);
