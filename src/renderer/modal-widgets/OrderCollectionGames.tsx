import { actions } from "common/actions";
import { getErrorMessage } from "common/butlerd/errors";
import * as messages from "common/butlerd/messages";
import { CollectionGame } from "common/butlerd/messages";
import { ModalWidgetProps } from "common/modals";
import {
  OrderCollectionGamesParams,
  OrderCollectionGamesResponse,
} from "common/modals/types";
import { Dispatch } from "common/types";
import classNames from "classnames";
import * as colors from "common/constants/colors";
import { transparentize } from "polished";
import React from "react";
import Button from "renderer/basics/Button";
import Cover from "renderer/basics/Cover";
import ErrorState from "renderer/basics/ErrorState";
import Filler from "renderer/basics/Filler";
import IconButton from "renderer/basics/IconButton";
import Icon from "renderer/basics/Icon";
import LoadingCircle from "renderer/basics/LoadingCircle";
import SortableList from "renderer/basics/SortableList";
import { rcall } from "renderer/butlerd/rcall";
import { doAsync } from "renderer/helpers/doAsync";
import { hook } from "renderer/hocs/hook";
import { closeModal, setModalUnclosable } from "renderer/helpers/modal";
import { arrayMove } from "common/util/array-move";
import { ModalButtons } from "renderer/basics/modal-styles";
import { ModalWidgetDiv } from "renderer/modal-widgets/styles";
import styled, * as styles from "renderer/styles";
import { T } from "renderer/t";

/** matches the site's edit order lightbox and Collections.OrderGames */
const maxOrderableGames = 500;

const Container = styled(ModalWidgetDiv)`
  display: flex;
  flex-direction: column;
  width: 600px;
  padding: 0;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 20px 20px 0 20px;

  .title {
    font-size: ${(props) => props.theme.fontSizes.larger};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .intro {
    font-size: ${(props) => props.theme.fontSizes.smaller};
    color: ${(props) => props.theme.secondaryText};
    line-height: 1.45;
  }
`;

const List = styled.div`
  margin: 14px 8px 0 8px;
`;

// one row plus its gap. close enough to the rendered size that the dialog
// opens at about its final height instead of growing once the list loads
const estimatedRowHeight = 65;
const maxRowsHeight = 380;

const Rows = styled(SortableList)`
  max-height: ${maxRowsHeight}px;
  padding-right: 4px;

  [data-sortable-row] + [data-sortable-row] {
    margin-top: 2px;
  }
` as typeof SortableList;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 8px 10px 8px 6px;
  border-radius: 12px;
  border: 1px solid transparent;
  box-sizing: border-box;

  [data-dragging] > & {
    /* solid so the rows sliding underneath don't show through */
    background: linear-gradient(
        rgba(255, 255, 255, 0.045),
        rgba(255, 255, 255, 0.045)
      ),
      ${colors.codGray};
    border-color: ${(props) => props.theme.inputBorder};
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.6);
  }

  .cover {
    width: 58px;
    flex-shrink: 0;
    border-radius: 4px;
    overflow: hidden;
  }

  &.removed .handle,
  &.removed .cover,
  &.removed .text {
    opacity: 0.45;
  }

  &.removed .title {
    text-decoration: line-through;
  }
`;

const Handle = styled.button`
  ${styles.resetButton};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  color: ${(props) => props.theme.secondaryText};
  cursor: grab;
  touch-action: none;

  &:focus-visible {
    outline: 1px solid ${(props) => props.theme.accent};
    border-radius: 16px;
  }

  &:disabled {
    cursor: default;
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
`;

const UndoButton = styled(Button)`
  min-width: 0;
  min-height: 28px;
  padding: 2px 10px;
  font-size: ${(props) => props.theme.fontSizes.smaller};
`;

const Loading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
`;

const Empty = styled.div`
  padding: 20px 12px;
  color: ${(props) => props.theme.secondaryText};
  text-align: center;
`;

const Notice = styled.div`
  margin: 14px 20px 0 20px;
  padding: 10px 14px;
  border-radius: 4px;
  background: ${(props) => transparentize(0.88, props.theme.error)};
  border: 1px solid ${(props) => transparentize(0.65, props.theme.error)};
  line-height: 1.45;
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

interface State {
  loading: boolean;
  error: Error | null;
  games: CollectionGame[];
  /** game ids in the order they were loaded, to tell a reorder from a no-op */
  loadedIds: number[];
  /** true when the collection has more games than can be reordered at once */
  truncated: boolean;
  /** game id -> staged for removal */
  removed: { [gameId: number]: boolean };
  saving: boolean;
  saveError: string | null;
}

const getGameId = (cg: CollectionGame) => cg.gameId;

class OrderCollectionGames extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      loading: true,
      error: null,
      games: [],
      loadedIds: [],
      truncated: false,
      removed: {},
      saving: false,
      saveError: null,
    };
  }

  override componentDidMount() {
    this.load();
  }

  load() {
    const { profileId } = this.props;
    const { collection } = this.props.modal.widgetParams;
    if (!profileId) {
      return;
    }
    this.setState({ loading: true, error: null });
    doAsync(async () => {
      try {
        const params = {
          profileId,
          collectionId: collection.id,
          limit: maxOrderableGames + 1,
        };
        let res: messages.FetchCollectionGamesResult;
        try {
          res = await rcall(messages.FetchCollectionGames, {
            ...params,
            fresh: true,
          });
        } catch (e) {
          // offline or the API is unhappy: order whatever butler has cached
          res = await rcall(messages.FetchCollectionGames, params);
        }
        const items = res.items ?? [];
        // butler can drop rows after applying the limit, so the cursor is
        // the reliable signal that more games exist
        const truncated = items.length > maxOrderableGames || !!res.nextCursor;
        const games = items.slice(0, maxOrderableGames);
        this.setState({
          loading: false,
          games,
          loadedIds: games.map(getGameId),
          truncated,
          removed: {},
        });
      } catch (e) {
        this.setState({ loading: false, error: e as Error });
      }
    });
  }

  override render() {
    const { collection } = this.props.modal.widgetParams;
    const { loading, error, games, saving, saveError, truncated } = this.state;
    const removedCount = this.removedIds().length;

    return (
      <Container>
        <Header>
          <span className="title">{collection.title}</span>
          <span className="intro">{T(["collection.order.intro"])}</span>
        </Header>

        {saveError ? (
          <Notice>
            {T(["collection.order.save_failed", { message: saveError }])}
          </Notice>
        ) : null}

        <List>
          {loading ? (
            <Loading
              style={{
                height: Math.min(
                  maxRowsHeight,
                  Math.max(
                    0,
                    (collection.gamesCount ?? 0) * estimatedRowHeight - 2
                  )
                ),
              }}
            >
              <LoadingCircle progress={-1} />
            </Loading>
          ) : error ? (
            <ErrorState error={error} />
          ) : games.length === 0 ? (
            <Empty>{T(["collection.order.empty"])}</Empty>
          ) : (
            <Rows
              items={games}
              getKey={getGameId}
              renderItem={this.renderRow}
              onSortEnd={this.move}
              handleSelector=".handle"
              disabled={saving}
            />
          )}
        </List>

        {truncated ? (
          <Notice>
            {T(["collection.order.truncated", { count: maxOrderableGames }])}
          </Notice>
        ) : null}

        <Footer>
          {removedCount > 0 ? (
            <span className="summary">
              {T(["collection.dialog.summary_remove", { count: removedCount }])}
            </span>
          ) : null}
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
            {T(["collection.order.save"])}
          </Button>
        </Footer>
      </Container>
    );
  }

  renderRow = (cg: CollectionGame, index: number) => {
    const game = cg.game;
    const isRemoved = !!this.state.removed[cg.gameId];
    const { saving } = this.state;

    return (
      <Row className={classNames({ removed: isRemoved })}>
        <Handle
          className="handle"
          type="button"
          disabled={saving}
          aria-label={game.title}
          onKeyDown={(ev) => this.onHandleKeyDown(ev, index)}
        >
          <Icon icon="menu" />
        </Handle>
        <div className="cover">
          <Cover
            gameId={game.id}
            coverUrl={game.stillCoverUrl || game.coverUrl}
            hover={false}
            showGifMarker={false}
            alt={game.title}
          />
        </div>
        <RowText className="text">
          <span className="title">{game.title}</span>
        </RowText>
        {isRemoved ? (
          <UndoButton
            disabled={saving}
            onClick={() => this.toggleRemoved(cg.gameId)}
          >
            {T(["collection.order.undo"])}
          </UndoButton>
        ) : (
          <IconButton
            icon="cross"
            hint={["collection.order.remove"]}
            disabled={saving}
            onClick={() => this.toggleRemoved(cg.gameId)}
          />
        )}
      </Row>
    );
  };

  // move with the keyboard

  onHandleKeyDown = (
    ev: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (this.state.saving) {
      return;
    }
    const last = this.state.games.length - 1;
    const jump = ev.ctrlKey || ev.metaKey;
    let to: number;
    switch (ev.key) {
      case "ArrowUp":
        to = jump ? 0 : index - 1;
        break;
      case "ArrowDown":
        to = jump ? last : index + 1;
        break;
      case "Home":
        to = 0;
        break;
      case "End":
        to = last;
        break;
      default:
        return;
    }
    ev.preventDefault();
    if (to < 0 || to > last) {
      return;
    }
    // rows are keyed by game id, so the handle survives the reorder and
    // just needs scrolling back into view
    const handle = ev.currentTarget;
    this.move(index, to, () => {
      handle.focus();
      handle.scrollIntoView({ block: "nearest" });
    });
  };

  move = (from: number, to: number, then?: () => void) => {
    if (from === to) {
      return;
    }
    this.setState(
      (state) => ({ games: arrayMove(state.games, from, to) }),
      then
    );
  };

  toggleRemoved(gameId: number) {
    this.setState((state) => ({
      removed: { ...state.removed, [gameId]: !state.removed[gameId] },
    }));
  }

  removedIds(): number[] {
    return this.state.games
      .filter((cg) => this.state.removed[cg.gameId])
      .map((cg) => cg.gameId);
  }

  hasChanges(): boolean {
    if (this.removedIds().length > 0) {
      return true;
    }
    const { games, loadedIds } = this.state;
    return games.some((cg, i) => cg.gameId !== loadedIds[i]);
  }

  onCancel = () => {
    closeModal(this.props.dispatch, this.props.modal);
  };

  setSaving(saving: boolean, saveError: string | null = null) {
    this.setState({ saving, saveError });
    setModalUnclosable(this.props.dispatch, this.props.modal, saving);
  }

  onSave = () => {
    const { profileId, dispatch } = this.props;
    const { collection } = this.props.modal.widgetParams;
    if (!profileId) {
      return;
    }
    const removeGameIds = this.removedIds();
    const gameIds = this.state.games
      .filter((cg) => !this.state.removed[cg.gameId])
      .map((cg) => cg.gameId);

    this.setSaving(true);
    doAsync(async () => {
      try {
        await rcall(messages.CollectionsOrderGames, {
          profileId,
          collectionId: collection.id,
          gameIds,
          removeGameIds: removeGameIds.length > 0 ? removeGameIds : undefined,
        });
      } catch (e) {
        this.setSaving(false, getErrorMessage(e));
        return;
      }
      dispatch(actions.collectionsChanged({}));
      this.setSaving(false);
      closeModal(dispatch, this.props.modal);
    });
  };
}

interface Props
  extends ModalWidgetProps<
    OrderCollectionGamesParams,
    OrderCollectionGamesResponse
  > {
  dispatch: Dispatch;
  profileId: number | null;
}

export default hook<{ profileId: number | null }>((map) => ({
  profileId: map((rs) => (rs.profile.profile ? rs.profile.profile.id : null)),
}))(OrderCollectionGames);
