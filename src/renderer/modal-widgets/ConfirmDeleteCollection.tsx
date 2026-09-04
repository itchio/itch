import { actions } from "common/actions";
import { ModalWidgetProps } from "common/modals";
import {
  ConfirmDeleteCollectionParams,
  ConfirmDeleteCollectionResponse,
} from "common/modals/types";
import { Dispatch } from "common/types";
import { ambientWind } from "common/util/navigation";
import React from "react";
import Button from "renderer/basics/Button";
import Checkbox from "renderer/basics/Checkbox";
import Filler from "renderer/basics/Filler";
import { hook } from "renderer/hocs/hook";
import { ModalButtons } from "renderer/basics/modal-styles";
import { ModalWidgetDiv } from "renderer/modal-widgets/styles";
import styled from "renderer/styles";
import { T } from "renderer/t";

const Container = styled(ModalWidgetDiv)`
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 600px;
  padding: 20px;
  line-height: 1.4;
`;

const CheckRow = styled.label`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  cursor: pointer;
`;

const Footer = styled(ModalButtons)`
  gap: 8px;
`;

interface State {
  confirmed: boolean;
}

class ConfirmDeleteCollection extends React.PureComponent<Props, State> {
  override state: State = { confirmed: false };

  override render() {
    const { collection } = this.props.modal.widgetParams;
    const { confirmed } = this.state;

    return (
      <Container>
        <p>
          {T(["prompt.delete_collection.message", { title: collection.title }])}
        </p>
        <CheckRow>
          <Checkbox checked={confirmed} onChange={this.onConfirmChange} />
          <span>{T(["prompt.delete_collection.understand"])}</span>
        </CheckRow>
        <Footer>
          <Filler />
          <Button onClick={this.onCancel}>{T(["prompt.action.cancel"])}</Button>
          <Button icon="delete" disabled={!confirmed} onClick={this.onDelete}>
            {T(["prompt.delete_collection.confirm"])}
          </Button>
        </Footer>
      </Container>
    );
  }

  onConfirmChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ confirmed: ev.target.checked });
  };

  onCancel = () => {
    const { dispatch } = this.props;
    dispatch(
      actions.closeModal({ wind: ambientWind(), id: this.props.modal.id })
    );
  };

  onDelete = () => {
    const { dispatch } = this.props;
    const { collection, tab } = this.props.modal.widgetParams;
    dispatch(
      actions.closeModal({
        wind: ambientWind(),
        id: this.props.modal.id,
        action: actions.deleteCollection({ collectionId: collection.id, tab }),
      })
    );
  };
}

interface Props
  extends ModalWidgetProps<
    ConfirmDeleteCollectionParams,
    ConfirmDeleteCollectionResponse
  > {
  dispatch: Dispatch;
}

export default hook()(ConfirmDeleteCollection);
