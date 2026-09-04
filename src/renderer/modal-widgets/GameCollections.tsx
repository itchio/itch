import { actions } from "common/actions";
import { getErrorMessage } from "common/butlerd/errors";
import * as messages from "common/butlerd/messages";
import { Collection } from "common/butlerd/messages";
import { ModalWidgetProps } from "common/modals";
import {
  GameCollectionsParams,
  GameCollectionsResponse,
} from "common/modals/types";
import { Dispatch } from "common/types";
import { ambientWind } from "common/util/navigation";
import { transparentize } from "polished";
import React from "react";
import Button from "renderer/basics/Button";
import Checkbox from "renderer/basics/Checkbox";
import { GameCover } from "renderer/basics/Cover";
import ErrorState from "renderer/basics/ErrorState";
import Filler from "renderer/basics/Filler";
import Icon from "renderer/basics/Icon";
import LoadingCircle from "renderer/basics/LoadingCircle";
import { rcall } from "renderer/butlerd/rcall";
import { doAsync } from "renderer/helpers/doAsync";
import { hook } from "renderer/hocs/hook";
import { ModalButtons } from "renderer/basics/modal-styles";
import { ModalWidgetDiv } from "renderer/modal-widgets/styles";
import styled from "renderer/styles";
import { T, TString } from "renderer/t";
import { IntlShape } from "react-intl";
import { injectIntl } from "renderer/hocs/injectIntl";

const Container = styled(ModalWidgetDiv)`
  display: flex;
  flex-direction: column;
  width: 600px;
  padding: 0;
  overflow: hidden;

  input[type="text"] {
    margin: 0;
    padding-left: 36px;
  }
`;

const GameRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 14px;
  padding: 20px 20px 0 20px;

  .cover {
    width: 84px;
    flex-shrink: 0;
  }
`;

const GameInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;

  .title {
    font-size: ${(props) => props.theme.fontSizes.larger};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .intro {
    font-size: ${(props) => props.theme.fontSizes.smaller};
    color: ${(props) => props.theme.secondaryText};
  }
`;

const FilterRow = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  margin: 16px 20px 0 20px;

  .icon {
    position: absolute;
    left: 12px;
    color: ${(props) => props.theme.inputPlaceholder};
    pointer-events: none;
  }
`;

const List = styled.div`
  height: 300px;
  overflow-y: auto;
  margin: 12px 8px 0 8px;
  padding-right: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const Row = styled.label`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.045);
  }

  &.disabled {
    cursor: default;
    opacity: 0.6;
  }
`;

const RowText = styled.span`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  .title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .meta {
    font-size: ${(props) => props.theme.fontSizes.small};
    color: ${(props) => props.theme.secondaryText};
  }
`;

const NewGroup = styled.div`
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.045);

  ${Row}:hover {
    background: none;
  }
`;

const PrivateRow = styled.label`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  padding: 0 12px 10px 40px;
  cursor: pointer;
  color: ${(props) => props.theme.secondaryText};
  font-size: ${(props) => props.theme.fontSizes.smaller};
`;

const Empty = styled.div`
  padding: 20px 12px;
  color: ${(props) => props.theme.secondaryText};
  text-align: center;
`;

const Footer = styled(ModalButtons)`
  align-items: center;
  gap: 8px;
  padding: 20px;

  .summary {
    color: ${(props) => props.theme.secondaryText};
    font-size: ${(props) => props.theme.fontSizes.smaller};
  }
`;

const SaveError = styled.div`
  margin: 12px 20px 0 20px;
  padding: 10px 14px;
  border-radius: 4px;
  background: ${(props) => transparentize(0.88, props.theme.error)};
  border: 1px solid ${(props) => transparentize(0.65, props.theme.error)};
  line-height: 1.45;
`;

interface NewCollection {
  key: number;
  title: string;
  private: boolean;
}

interface State {
  loading: boolean;
  error: Error | null;
  collections: Collection[];
  /** collection id -> whether the game should be in it once saved */
  checked: { [id: number]: boolean };
  filter: string;
  newCollections: NewCollection[];
  saving: boolean;
  saveError: string | null;
}

let nextNewKey = 1;

class GameCollections extends React.PureComponent<Props, State> {
  filterRef = React.createRef<HTMLInputElement>();

  constructor(props: Props) {
    super(props);
    this.state = {
      loading: true,
      error: null,
      collections: [],
      checked: {},
      filter: "",
      newCollections: [],
      saving: false,
      saveError: null,
    };
  }

  override componentDidMount() {
    this.load();
  }

  load() {
    const { profileId } = this.props;
    const { game } = this.props.modal.widgetParams;
    if (!profileId) {
      return;
    }
    this.setState({ loading: true, error: null });
    doAsync(async () => {
      try {
        const res = await rcall(messages.FetchProfileCollections, {
          profileId,
          gameId: game.id,
        });
        const collections = res.items ?? [];
        const checked: State["checked"] = {};
        for (const c of collections) {
          checked[c.id] = !!c.hasGame;
        }
        this.setState({ loading: false, collections, checked });
      } catch (e) {
        this.setState({ loading: false, error: e as Error });
      }
    });
  }

  override render() {
    const { game } = this.props.modal.widgetParams;
    const { loading, error, saving, saveError } = this.state;

    return (
      <Container>
        <GameRow>
          <div className="cover">
            <GameCover game={game} />
          </div>
          <GameInfo>
            <span className="title">{game.title}</span>
            <span className="intro">{T(["collection.dialog.intro"])}</span>
          </GameInfo>
        </GameRow>

        <FilterRow>
          <Icon icon="search" />
          <input
            type="text"
            ref={this.filterRef}
            value={this.state.filter}
            placeholder={TString(this.props.intl, [
              "collection.dialog.filter_placeholder",
            ])}
            disabled={loading || saving}
            onChange={this.onFilterChange}
            onKeyDown={this.onFilterKeyDown}
            autoFocus
          />
        </FilterRow>

        {saveError ? (
          <SaveError>
            {T(["collection.dialog.save_failed", { message: saveError }])}
          </SaveError>
        ) : null}

        <List>
          {loading ? (
            <Empty>
              <LoadingCircle progress={-1} />
            </Empty>
          ) : error ? (
            <ErrorState error={error} />
          ) : (
            this.renderRows()
          )}
        </List>

        <Footer>
          {this.renderSummary()}
          <Filler />
          <Button onClick={this.onCancel} disabled={saving}>
            {T(["prompt.action.cancel"])}
          </Button>
          <Button
            primary
            onClick={this.onSave}
            disabled={loading || saving || !this.hasChanges()}
          >
            {saving ? <LoadingCircle progress={-1} /> : null}
            {T(["prompt.action.save"])}
          </Button>
        </Footer>
      </Container>
    );
  }

  renderRows() {
    const { collections, newCollections, checked, saving, filter } = this.state;
    const needle = filter.trim().toLowerCase();
    const matches = (title: string) =>
      needle === "" || title.toLowerCase().includes(needle);

    const visibleNew = newCollections.filter((nc) => matches(nc.title));
    const visible = collections.filter((c) => matches(c.title));
    const rows: JSX.Element[] = [];

    if (needle !== "" && !this.exactMatchExists(filter.trim())) {
      rows.push(
        <Row
          key="create"
          className={saving ? "disabled" : ""}
          onClick={this.onCreateClick}
        >
          <Checkbox checked={false} onChange={noop} disabled={saving} />
          <RowText>
            <span className="title">
              <Icon icon="plus" />{" "}
              {T(["collection.dialog.create", { title: filter.trim() }])}
            </span>
          </RowText>
        </Row>
      );
    }

    for (const nc of visibleNew) {
      rows.push(
        <NewGroup key={`new-${nc.key}`}>
          <Row className={saving ? "disabled" : ""}>
            <Checkbox
              checked={true}
              onChange={() => this.removeNew(nc.key)}
              disabled={saving}
            />
            <RowText>
              <span className="title">{nc.title}</span>
              <span className="meta">{T(["collection.dialog.new"])}</span>
            </RowText>
          </Row>
          <PrivateRow>
            <Checkbox
              checked={nc.private}
              onChange={(ev) => this.setNewPrivate(nc.key, ev.target.checked)}
              disabled={saving}
            />
            <span>{T(["collection.dialog.private"])}</span>
          </PrivateRow>
        </NewGroup>
      );
    }

    for (const c of visible) {
      rows.push(
        <Row key={c.id} className={saving ? "disabled" : ""}>
          <Checkbox
            checked={!!checked[c.id]}
            onChange={(ev) => this.setChecked(c.id, ev.target.checked)}
            disabled={saving}
          />
          <RowText>
            <span className="title">{c.title}</span>
            <span className="meta">
              {T(["collection.item_count", { itemCount: c.gamesCount }])}
              {c.private ? <> · {T(["collection.info.private"])}</> : null}
            </span>
          </RowText>
        </Row>
      );
    }

    if (rows.length === 0) {
      return (
        <Empty>
          {collections.length === 0 && newCollections.length === 0
            ? T(["collection.dialog.empty"])
            : T(["collection.dialog.no_match"])}
        </Empty>
      );
    }
    return rows;
  }

  renderSummary() {
    const { adds, removes } = this.diff();
    const creates = this.state.newCollections.length;
    const parts: JSX.Element[] = [];
    if (adds.length > 0) {
      parts.push(
        <span key="add">
          {T(["collection.dialog.summary_add", { count: adds.length }])}
        </span>
      );
    }
    if (removes.length > 0) {
      parts.push(
        <span key="remove">
          {T(["collection.dialog.summary_remove", { count: removes.length }])}
        </span>
      );
    }
    if (creates > 0) {
      parts.push(
        <span key="create">
          {T(["collection.dialog.summary_create", { count: creates }])}
        </span>
      );
    }
    if (parts.length === 0) {
      return null;
    }
    return (
      <span className="summary">
        {parts.map((p, i) => (
          <React.Fragment key={i}>
            {i > 0 ? ", " : null}
            {p}
          </React.Fragment>
        ))}
      </span>
    );
  }

  exactMatchExists(title: string): boolean {
    const lower = title.toLowerCase();
    return (
      this.state.collections.some((c) => c.title.toLowerCase() === lower) ||
      this.state.newCollections.some((nc) => nc.title.toLowerCase() === lower)
    );
  }

  diff(): { adds: Collection[]; removes: Collection[] } {
    const adds: Collection[] = [];
    const removes: Collection[] = [];
    for (const c of this.state.collections) {
      const want = !!this.state.checked[c.id];
      const has = !!c.hasGame;
      if (want && !has) {
        adds.push(c);
      } else if (!want && has) {
        removes.push(c);
      }
    }
    return { adds, removes };
  }

  hasChanges(): boolean {
    const { adds, removes } = this.diff();
    return (
      adds.length > 0 ||
      removes.length > 0 ||
      this.state.newCollections.length > 0
    );
  }

  setChecked(id: number, value: boolean) {
    this.setState((state) => ({
      checked: { ...state.checked, [id]: value },
    }));
  }

  addNew(title: string) {
    this.setState((state) => ({
      newCollections: [
        { key: nextNewKey++, title, private: false },
        ...state.newCollections,
      ],
      filter: "",
    }));
    this.filterRef.current?.focus();
  }

  removeNew(key: number) {
    this.setState((state) => ({
      newCollections: state.newCollections.filter((nc) => nc.key !== key),
    }));
  }

  setNewPrivate(key: number, value: boolean) {
    this.setState((state) => ({
      newCollections: state.newCollections.map((nc) =>
        nc.key === key ? { ...nc, private: value } : nc
      ),
    }));
  }

  onFilterChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ filter: ev.target.value });
  };

  onFilterKeyDown = (ev: React.KeyboardEvent<HTMLInputElement>) => {
    if (ev.key !== "Enter") {
      return;
    }
    const title = this.state.filter.trim();
    if (title === "" || this.exactMatchExists(title) || this.state.saving) {
      return;
    }
    ev.preventDefault();
    this.addNew(title);
  };

  onCreateClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    if (this.state.saving) {
      return;
    }
    this.addNew(this.state.filter.trim());
  };

  onCancel = () => {
    this.close();
  };

  close() {
    const { dispatch } = this.props;
    dispatch(
      actions.closeModal({
        wind: ambientWind(),
        id: this.props.modal.id,
      })
    );
  }

  onSave = () => {
    const { profileId, dispatch } = this.props;
    const { game } = this.props.modal.widgetParams;
    if (!profileId) {
      return;
    }
    const { adds, removes } = this.diff();
    const creates = [...this.state.newCollections];

    this.setSaving(true);
    doAsync(async () => {
      let changed = false;
      try {
        for (const nc of creates) {
          await rcall(messages.CollectionsCreate, {
            profileId,
            title: nc.title,
            private: nc.private,
            gameId: game.id,
          });
          changed = true;
          this.removeNew(nc.key);
        }
        for (const c of adds) {
          await rcall(messages.CollectionsAddGame, {
            profileId,
            collectionId: c.id,
            gameId: game.id,
          });
          changed = true;
        }
        for (const c of removes) {
          await rcall(messages.CollectionsRemoveGame, {
            profileId,
            collectionId: c.id,
            gameId: game.id,
          });
          changed = true;
        }
      } catch (e) {
        if (changed) {
          dispatch(actions.collectionsChanged({}));
        }
        this.setSaving(false, getErrorMessage(e));
        // show what actually went through
        this.load();
        return;
      }

      if (changed) {
        dispatch(actions.collectionsChanged({}));
      }
      this.setSaving(false);
      this.close();
    });
  };

  /** the header close button and Escape stay disabled while requests run */
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
}

function noop() {}

interface Props
  extends ModalWidgetProps<GameCollectionsParams, GameCollectionsResponse> {
  dispatch: Dispatch;
  profileId: number | null;
  intl: IntlShape;
}

export default hook<{ profileId: number | null }>((map) => ({
  profileId: map((rs) => (rs.profile.profile ? rs.profile.profile.id : null)),
}))(injectIntl(GameCollections));
