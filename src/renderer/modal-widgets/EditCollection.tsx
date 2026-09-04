import { actions } from "common/actions";
import { getErrorMessage } from "common/butlerd/errors";
import * as messages from "common/butlerd/messages";
import { ModalWidgetProps } from "common/modals";
import {
  EditCollectionParams,
  EditCollectionResponse,
} from "common/modals/types";
import { Dispatch } from "common/types";
import { ambientWind } from "common/util/navigation";
import { transparentize } from "polished";
import React from "react";
import Button from "renderer/basics/Button";
import Checkbox from "renderer/basics/Checkbox";
import Filler from "renderer/basics/Filler";
import LoadingCircle from "renderer/basics/LoadingCircle";
import { rcall } from "renderer/butlerd/rcall";
import { doAsync } from "renderer/helpers/doAsync";
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

  input[type="text"] {
    margin: 0;
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  .label {
    color: ${(props) => props.theme.secondaryText};
    font-size: ${(props) => props.theme.fontSizes.smaller};
  }
`;

const CheckRow = styled.label`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  cursor: pointer;

  .text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .hint {
    color: ${(props) => props.theme.secondaryText};
    font-size: ${(props) => props.theme.fontSizes.small};
  }
`;

const SaveError = styled.div`
  padding: 10px 14px;
  border-radius: 4px;
  background: ${(props) => transparentize(0.88, props.theme.error)};
  border: 1px solid ${(props) => transparentize(0.65, props.theme.error)};
  line-height: 1.45;
`;

const Footer = styled(ModalButtons)`
  gap: 8px;

  .delete {
    min-width: 0;
    padding-left: 0;
    color: ${(props) => props.theme.secondaryText};

    &:hover:not(:disabled) {
      color: ${(props) => props.theme.error};
    }
  }
`;

interface State {
  title: string;
  private: boolean;
  saving: boolean;
  saveError: string | null;
}

class EditCollection extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    const { collection } = props.modal.widgetParams;
    this.state = {
      title: collection?.title ?? "",
      private: collection?.private ?? false,
      saving: false,
      saveError: null,
    };
  }

  override render() {
    const { collection } = this.props.modal.widgetParams;
    const { saving, saveError } = this.state;

    return (
      <Container>
        <Field>
          <span className="label">{T(["collection.edit.title_label"])}</span>
          <input
            type="text"
            value={this.state.title}
            onChange={this.onTitleChange}
            onKeyDown={this.onKeyDown}
            disabled={saving}
            autoFocus
          />
        </Field>

        <CheckRow>
          <Checkbox
            checked={this.state.private}
            onChange={this.onPrivateChange}
            disabled={saving}
          />
          <span className="text">
            <span>{T(["collection.dialog.private"])}</span>
            <span className="hint">{T(["collection.edit.private_hint"])}</span>
          </span>
        </CheckRow>

        {saveError ? (
          <SaveError>
            {T(["collection.edit.save_failed", { message: saveError }])}
          </SaveError>
        ) : null}

        <Footer>
          {collection ? (
            <Button
              className="delete"
              translucent
              onClick={this.onDelete}
              disabled={saving}
            >
              {T(["collection.edit.delete"])}
            </Button>
          ) : null}
          <Filler />
          <Button onClick={this.onCancel} disabled={saving}>
            {T(["prompt.action.cancel"])}
          </Button>
          <Button
            primary
            onClick={this.onSave}
            disabled={saving || !this.canSave()}
          >
            {saving ? <LoadingCircle progress={-1} /> : null}
            {T(["prompt.action.save"])}
          </Button>
        </Footer>
      </Container>
    );
  }

  canSave(): boolean {
    const { collection } = this.props.modal.widgetParams;
    const title = this.state.title.trim();
    if (title === "") {
      return false;
    }
    if (!collection) {
      return true;
    }
    return (
      title !== collection.title || this.state.private !== !!collection.private
    );
  }

  onTitleChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ title: ev.target.value });
  };

  onPrivateChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ private: ev.target.checked });
  };

  onKeyDown = (ev: React.KeyboardEvent<HTMLInputElement>) => {
    if (ev.key === "Enter" && this.canSave() && !this.state.saving) {
      ev.preventDefault();
      this.onSave();
    }
  };

  onCancel = () => {
    const { dispatch } = this.props;
    dispatch(
      actions.closeModal({
        wind: ambientWind(),
        id: this.props.modal.id,
      })
    );
  };

  onDelete = () => {
    const { dispatch } = this.props;
    const { collection, tab } = this.props.modal.widgetParams;
    if (!collection) {
      return;
    }
    dispatch(
      actions.closeModal({
        wind: ambientWind(),
        id: this.props.modal.id,
        action: actions.requestCollectionDelete({
          collectionId: collection.id,
          tab,
        }),
      })
    );
  };

  /** the header close button and Escape stay disabled while the request runs */
  setSaving(saving: boolean, saveError: string | null = null) {
    const { dispatch } = this.props;
    this.setState({ saving, saveError });
    dispatch(
      actions.setModalUnclosable({
        wind: ambientWind(),
        id: this.props.modal.id,
        unclosable: saving,
      })
    );
  }

  onSave = () => {
    const { profileId, dispatch } = this.props;
    const { collection } = this.props.modal.widgetParams;
    if (!profileId) {
      return;
    }
    const title = this.state.title.trim();
    const isPrivate = this.state.private;

    this.setSaving(true);
    doAsync(async () => {
      try {
        if (collection) {
          await rcall(messages.CollectionsUpdate, {
            profileId,
            collectionId: collection.id,
            title: title !== collection.title ? title : undefined,
            private: isPrivate !== !!collection.private ? isPrivate : undefined,
          });
        } else {
          await rcall(messages.CollectionsCreate, {
            profileId,
            title,
            private: isPrivate,
          });
        }
      } catch (e) {
        this.setSaving(false, getErrorMessage(e));
        return;
      }
      dispatch(actions.collectionsChanged({}));
      this.setSaving(false);
      dispatch(
        actions.closeModal({
          wind: ambientWind(),
          id: this.props.modal.id,
        })
      );
    });
  };
}

interface Props
  extends ModalWidgetProps<EditCollectionParams, EditCollectionResponse> {
  dispatch: Dispatch;
  profileId: number | null;
}

export default hook<{ profileId: number | null }>((map) => ({
  profileId: map((rs) => (rs.profile.profile ? rs.profile.profile.id : null)),
}))(EditCollection);
