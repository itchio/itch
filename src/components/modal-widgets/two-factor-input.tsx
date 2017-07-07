import * as React from "react";
import { connect, I18nProps } from "../connect";

import { IModalWidgetProps, ModalWidgetDiv } from "./modal-widget";

export class TwoFactorInput extends React.PureComponent<
  IProps & IDerivedProps & I18nProps
> {
  refs: {
    totpInput?: HTMLInputElement;
  };

  constructor() {
    super();
  }

  render() {
    const { t } = this.props;
    const params = this.props.modal.widgetParams as ITwoFactorInputParams;
    const { username } = params;

    return (
      <ModalWidgetDiv>
        <p>
          <strong>
            {t("login.two_factor.as_user", { username })}
          </strong>
        </p>

        <p>
          {t("login.two_factor.enter_code")}
        </p>

        <input
          placeholder={t("login.two_factor.verification_code_label")}
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

interface IProps extends IModalWidgetProps {
  params: ITwoFactorInputParams;
}

interface IDerivedProps {}

export default connect<IProps>(TwoFactorInput);
