import urls from "common/constants/urls";
import { ModalWidgetProps } from "common/modals";
import {
  TwoFactorInputParams,
  TwoFactorInputResponse,
} from "common/modals/types";
import React from "react";
import { ModalWidgetDiv } from "renderer/modal-widgets/styles";
import { T } from "renderer/t";
import styled from "renderer/styles";
import { hook } from "renderer/hocs/hook";
import { Dispatch } from "common/types";
import { actions } from "common/actions";
import { ambientWind } from "common/util/navigation";
import { ModalButtons } from "renderer/basics/modal-styles";
import Button from "renderer/basics/Button";
import { injectIntl, IntlShape } from "react-intl";

const CodeInput = styled.input`
  font-size: 36px !important;
  width: 6em !important;
  font-weight: bold;
  text-align: center;
  letter-spacing: 0.2em;
`;

const CodeInputContainer = styled.div`
  width: 100%;
  text-align: center;
`;

const CODE_LENGTH = 6;
const CODE_MIN_LENGTH = CODE_LENGTH;
const CODE_MAX_LENGTH = CODE_LENGTH;

class TwoFactorInput extends React.PureComponent<Props, State> {
  input?: HTMLInputElement;

  constructor(props: Props, context: any) {
    super(props, context);
    this.state = {
      valid: false,
    };
  }

  render() {
    const params = this.props.modal.widgetParams;
    const { username } = params;
    const { valid } = this.state;

    return (
      <ModalWidgetDiv>
        <p>
          <strong>{T(["login.two_factor.as_user", { username }])}</strong>
        </p>

        <p>{T(["login.two_factor.enter_code"])}</p>

        <CodeInputContainer>
          <CodeInput
            ref={this.gotInput}
            type="number"
            minLength={CODE_MIN_LENGTH}
            maxLength={CODE_MAX_LENGTH}
            onKeyDown={this.onKeyDown}
            onKeyUp={this.onChange}
            onChange={this.onChange}
            autoFocus
          />
        </CodeInputContainer>

        <p>
          <a target="_blank" href={urls.twoFactorHelp}>
            {T(["login.two_factor.learn_more"])}
          </a>
        </p>

        <ModalButtons>
          <Button disabled={!valid} onClick={this.onContinue}>
            {T(["prompt.action.continue"])}
          </Button>
        </ModalButtons>
      </ModalWidgetDiv>
    );
  }

  gotInput = (input: HTMLInputElement) => {
    this.input = input;
  };

  onKeyDown = (ev: React.KeyboardEvent<any>) => {
    if (ev.key === "Enter") {
      this.onContinue();
    }
  };

  onChange = () => {
    const { input } = this;
    this.setState({
      valid: input.value.length === 6,
    });

    this.props.updatePayload({
      totpCode: input.value,
    });
  };

  onContinue = () => {
    if (!this.state.valid) {
      return;
    }

    const { input } = this;
    const { dispatch } = this.props;
    let response: TwoFactorInputResponse = {
      totpCode: input.value,
    };
    dispatch(
      actions.closeModal({
        wind: ambientWind(),
        id: this.props.modal.id,
        action: actions.modalResponse(response),
      })
    );
  };
}

interface Props
  extends ModalWidgetProps<TwoFactorInputParams, TwoFactorInputResponse> {
  params: TwoFactorInputParams;

  intl: IntlShape;
  dispatch: Dispatch;
}

interface State {
  valid: boolean;
}

export default injectIntl(hook()(TwoFactorInput));
