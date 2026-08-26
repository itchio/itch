import { actions } from "common/actions";
import { fileSize } from "common/format/filesize";
import { ModalWidgetProps } from "common/modals";
import {
  SteamShortcutsParams,
  SteamShortcutsResponse,
} from "common/modals/types";
import { Dispatch } from "common/types";
import { SteamDirectTarget, SteamShortcutMode } from "common/types/steam";
import { ambientWind } from "common/util/navigation";
import { lighten, transparentize } from "polished";
import React from "react";
import Button from "renderer/basics/Button";
import Checkbox from "renderer/basics/Checkbox";
import Icon from "renderer/basics/Icon";
import LoadingCircle from "renderer/basics/LoadingCircle";
import TimeAgo from "renderer/basics/TimeAgo";
import { hook } from "renderer/hocs/hook";
import { ModalButtons, ModalButtonSpacer } from "renderer/basics/modal-styles";
import { ModalWidgetDiv } from "renderer/modal-widgets/styles";
import styled from "renderer/styles";
import { T } from "renderer/t";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 540px;
  max-width: 640px;
`;

const Intro = styled.div`
  font-size: ${(props) => props.theme.fontSizes.smaller};
  color: ${(props) => props.theme.secondaryText};
  line-height: 1.5;
`;

// same recipe as PushBuild ReviewPanel's ConfirmCallout
const Callout = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 4px;
  background: ${(props) => transparentize(0.88, props.theme.caution)};
  border: 1px solid ${(props) => transparentize(0.65, props.theme.caution)};
  color: ${(props) => props.theme.baseText};
  line-height: 1.45;

  .icon {
    color: ${(props) => lighten(0.08, props.theme.caution)};
    margin-top: 2px;
    font-size: 110%;
  }

  &.error {
    background: ${(props) => transparentize(0.88, props.theme.error)};
    border-color: ${(props) => transparentize(0.65, props.theme.error)};

    .icon {
      color: ${(props) => lighten(0.08, props.theme.error)};
    }
  }
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid ${(props) => props.theme.inputBorder};
  border-radius: 4px;
  overflow: hidden;
`;

const ListHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  background: ${(props) => props.theme.breadBackground};
  padding: 8px 14px;
  border-bottom: 1px solid #2a2a2a;

  .label {
    font-size: ${(props) => props.theme.fontSizes.small};
    color: ${(props) => props.theme.secondaryText};
    text-transform: uppercase;
    letter-spacing: 0.06em;
    flex-grow: 1;
  }
`;

const MiniButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  font-family: inherit;
  font-size: 13px;
  color: ${(props) => props.theme.baseText};
  border: 1px solid ${(props) => props.theme.inputBorder};
  border-radius: 3px;
  background: #242020;
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: ${(props) => props.theme.inputBorderFocused};
  }

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }
`;

const Rows = styled.div`
  display: flex;
  flex-direction: column;
  max-height: 300px;
  overflow-y: auto;
`;

const Row = styled.label`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  cursor: pointer;

  & + & {
    border-top: 1px solid #2a2a2a;
  }

  &.pending {
    background: #1d1a17;
  }

  &.disabled {
    cursor: default;
  }

  .title {
    font-weight: bold;
    /* long titles wrap; unbroken ones would overflow the row */
    min-width: 0;
    overflow-wrap: anywhere;
  }

  &.removing .title {
    color: ${(props) => props.theme.secondaryText};
    text-decoration: line-through;
  }

  .hint {
    font-size: ${(props) => props.theme.fontSizes.small};
    color: ${(props) => props.theme.ternaryText};
  }

  .filler {
    flex-grow: 1;
  }
`;

const ModeButton = styled.button`
  flex-shrink: 0;
  font-family: inherit;
  font-size: 11px;
  letter-spacing: 0.05em;
  padding: 3px 8px;
  border-radius: 2px;
  border: 1px solid ${(props) => props.theme.inputBorder};
  background: none;
  color: ${(props) => props.theme.secondaryText};
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: ${(props) => props.theme.inputBorderFocused};
    color: ${(props) => props.theme.baseText};
  }

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }
`;

const TagSpan = styled.span`
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  font-size: 11px;
  letter-spacing: 0.05em;
  padding: 3px 8px;
  border-radius: 2px;
  border: 1px solid ${(props) => transparentize(0.65, props.theme.success)};
  color: ${(props) => props.theme.success};

  &.will-add {
    background: ${(props) => transparentize(0.92, props.theme.success)};
  }

  &.caution {
    border-color: ${(props) => transparentize(0.65, props.theme.caution)};
    color: ${(props) => props.theme.caution};
  }

  &.will-remove {
    border-color: ${(props) => transparentize(0.65, props.theme.error)};
    color: ${(props) => props.theme.error};
    background: ${(props) => transparentize(0.92, props.theme.error)};
  }
`;

const DetailsBox = styled.details`
  font-size: ${(props) => props.theme.fontSizes.small};

  summary {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    list-style: none;
    color: ${(props) => props.theme.secondaryText};

    &::-webkit-details-marker {
      display: none;
    }

    .icon {
      font-size: 9px;
      transition: transform 0.1s;
    }
  }

  &[open] summary .icon {
    transform: rotate(90deg);
  }

  .grid {
    margin-top: 8px;
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr) max-content minmax(0, 1fr);
    gap: 8px 18px;
    padding: 12px 14px;
    background: ${(props) => props.theme.itemBackground};
    border: 1px solid ${(props) => props.theme.inputBorder};
    border-radius: 4px;

    .label {
      color: ${(props) => props.theme.ternaryText};
    }

    .value {
      color: ${(props) => props.theme.baseText};
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      user-select: text;

      &.mono {
        font-family: monospace;
      }

      &.caution {
        color: ${(props) => props.theme.caution};
      }
    }
  }
`;

const Footer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;

  /* ModalButtons is width: 100%, which overflows next to the summary */
  ${ModalButtons} {
    width: auto;
    flex-grow: 1;
    min-width: 0;
  }

  .summary {
    font-size: ${(props) => props.theme.fontSizes.small};
    color: ${(props) => props.theme.secondaryText};

    .add {
      color: ${(props) => props.theme.success};
    }

    .remove {
      color: ${(props) => props.theme.error};
    }

    &.clean {
      color: ${(props) => props.theme.ternaryText};
    }
  }
`;

interface RowData {
  gameId: number;
  title: string;
  installed: boolean;
  inSteam: boolean;
  hasCoverArt: boolean;
  /** entry exists but its launcher fields or title need rewriting */
  needsRepair: boolean;
  /** mode of the existing Steam entry, null when not in Steam */
  steamMode: SteamShortcutMode | null;
  /**
   * command a "direct" shortcut would use: undefined while still
   * resolving, null when the game has no supported native target
   */
  directTarget: SteamDirectTarget | null | undefined;
}

interface Props
  extends ModalWidgetProps<SteamShortcutsParams, SteamShortcutsResponse> {
  dispatch: Dispatch;
}

interface State {
  checked: { [gameId: number]: boolean };
  /** staged mode overrides; a row's default is its entry's current mode */
  modes: { [gameId: number]: SteamShortcutMode };
  baselineKey: string;
}

function unquote(s: string): string {
  const m = /^"(.*)"$/.exec(s);
  return m ? m[1] : s;
}

function rowsOf(params: SteamShortcutsParams): RowData[] {
  const targets = params.directTargets;
  const byId = new Map<number, RowData>();
  for (const game of params.installedGames) {
    byId.set(game.id, {
      gameId: game.id,
      title: game.title,
      installed: true,
      inSteam: false,
      hasCoverArt: !!(game.stillCoverUrl || game.coverUrl),
      needsRepair: false,
      steamMode: null,
      directTarget: targets ? targets[game.id] ?? null : undefined,
    });
  }
  for (const entry of params.snapshot.entries) {
    const existing = byId.get(entry.gameId);
    if (existing) {
      existing.inSteam = true;
      existing.steamMode = entry.mode;
      // the snapshot can't know the game's current launch target;
      // detect a moved executable here where both sides are available
      const driftedTarget =
        entry.mode === "direct" &&
        existing.directTarget != null &&
        (unquote(entry.exe) !== existing.directTarget.path ||
          entry.launchOptions !== existing.directTarget.launchOptions);
      // missing art only counts when installed: healing it needs the
      // game's cover url
      existing.needsRepair =
        entry.needsRepair ||
        driftedTarget ||
        entry.appName !== existing.title ||
        (entry.missingArt && existing.hasCoverArt);
    } else {
      byId.set(entry.gameId, {
        gameId: entry.gameId,
        title: entry.appName,
        installed: false,
        inSteam: true,
        hasCoverArt: false,
        // itch-mode launcher fields are repairable without the game
        // installed; a direct entry's target is not
        needsRepair: entry.mode === "itch" && entry.needsRepair,
        steamMode: entry.mode,
        directTarget: null,
      });
    }
  }
  return [...byId.values()].sort((a, b) =>
    a.title.toLowerCase().localeCompare(b.title.toLowerCase())
  );
}

function baselineKeyOf(params: SteamShortcutsParams): string {
  return rowsOf(params)
    .map(
      (r) =>
        `${r.gameId}:${r.installed ? 1 : 0}${r.inSteam ? 1 : 0}${
          r.steamMode === "direct" ? "d" : "i"
        }`
    )
    .join(",");
}

function baselineChecked(params: SteamShortcutsParams): State["checked"] {
  const checked: State["checked"] = {};
  for (const row of rowsOf(params)) {
    checked[row.gameId] = row.inSteam;
  }
  return checked;
}

class SteamShortcuts extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    const params = props.modal.widgetParams;
    const checked = baselineChecked(params);
    const { initialGameId } = params;
    if (initialGameId && checked[initialGameId] === false) {
      checked[initialGameId] = true;
    }
    this.state = { checked, modes: {}, baselineKey: baselineKeyOf(params) };
  }

  override componentDidUpdate() {
    // a save (or external change) replaced the union; polling updates
    // that only flip steamRunning keep the same key and keep staging
    const params = this.props.modal.widgetParams;
    const key = baselineKeyOf(params);
    if (key !== this.state.baselineKey) {
      this.setState({
        checked: baselineChecked(params),
        modes: {},
        baselineKey: key,
      });
    }
  }

  stagedMode(row: RowData): SteamShortcutMode {
    return this.state.modes[row.gameId] ?? row.steamMode ?? "itch";
  }

  override render() {
    const { snapshot } = this.props.modal.widgetParams;

    return (
      <ModalWidgetDiv>
        <Container>
          {snapshot.lastOpError ? (
            <Callout className="error">
              <Icon icon="error" />
              <span>{T(snapshot.lastOpError)}</span>
            </Callout>
          ) : null}
          {snapshot.parseError ? (
            <Callout className="error">
              <Icon icon="error" />
              <span>
                {T(["steam.dialog.parse_error"])} {snapshot.parseError}
              </span>
            </Callout>
          ) : null}
          {snapshot.steamRunning ? (
            <Callout>
              <Icon icon="warning" />
              <span>{T(["steam.dialog.steam_running"])}</span>
            </Callout>
          ) : null}

          {this.renderBody()}
        </Container>
      </ModalWidgetDiv>
    );
  }

  renderBody() {
    const { snapshot, saving } = this.props.modal.widgetParams;

    if (!snapshot.steamRoot) {
      return this.renderUnavailable(["steam.error.not_found"]);
    }
    if (!snapshot.userId) {
      return this.renderUnavailable(["steam.error.no_user"]);
    }

    const rows = rowsOf(this.props.modal.widgetParams);
    return (
      <>
        <Intro>{T(["steam.dialog.intro"])}</Intro>
        <List>
          <ListHeader>
            <div className="label">{T(["steam.dialog.list_header"])}</div>
            <MiniButton
              disabled={saving}
              onClick={this.onAddInstalled}
              data-rh={JSON.stringify(["steam.dialog.add_installed_hint"])}
              data-rh-at="top"
            >
              <Icon icon="plus" />
              {T(["steam.dialog.add_installed"])}
            </MiniButton>
            <MiniButton
              disabled={saving}
              onClick={this.onRemoveMissing}
              data-rh={JSON.stringify(["steam.dialog.remove_missing_hint"])}
              data-rh-at="top"
            >
              <Icon icon="uninstall" />
              {T(["steam.dialog.remove_missing"])}
            </MiniButton>
            <MiniButton
              disabled={saving}
              onClick={this.onRemoveAll}
              data-rh={JSON.stringify(["steam.dialog.remove_all_hint"])}
              data-rh-at="top"
            >
              <Icon icon="uninstall" />
              {T(["steam.dialog.remove_all"])}
            </MiniButton>
          </ListHeader>
          <Rows>
            {rows.length === 0 ? (
              <Row as="div">
                <span className="hint">{T(["steam.dialog.empty"])}</span>
              </Row>
            ) : (
              rows.map((row) => this.renderRow(row))
            )}
          </Rows>
        </List>
        {rows.some(
          (r) =>
            !!this.state.checked[r.gameId] && this.stagedMode(r) === "direct"
        ) ? (
          <Callout>
            <Icon icon="warning" />
            <span>{T(["steam.dialog.direct_warning"])}</span>
          </Callout>
        ) : null}
        {this.renderDetailsLine()}
        {this.renderFooter(rows)}
      </>
    );
  }

  renderUnavailable(message: string[]) {
    return (
      <>
        <Callout className="error">
          <Icon icon="error" />
          <span>{T(message)}</span>
        </Callout>
        <ModalButtons>
          <Button label={T(["prompt.action.close"])} onClick={this.onClose} />
        </ModalButtons>
      </>
    );
  }

  renderRow(row: RowData) {
    const { saving } = this.props.modal.widgetParams;
    const checked = !!this.state.checked[row.gameId];
    const willAdd = checked && !row.inSteam;
    const willRemove = !checked && row.inSteam;
    const willUpdate = checked && row.inSteam && this.rowWillUpdate(row);
    const pending = willAdd || willRemove || willUpdate;

    let tag: JSX.Element | null = null;
    if (willAdd) {
      tag = (
        <TagSpan className="will-add">{T(["steam.dialog.will_add"])}</TagSpan>
      );
    } else if (willRemove) {
      tag = (
        <TagSpan className="will-remove">
          {T(["steam.dialog.will_remove"])}
        </TagSpan>
      );
    } else if (willUpdate) {
      tag = (
        <TagSpan className="caution">{T(["steam.dialog.will_update"])}</TagSpan>
      );
    } else if (row.inSteam && !row.installed) {
      tag = (
        <TagSpan className="caution">
          <Icon icon="warning" />
          {T(["steam.dialog.not_installed"])}
        </TagSpan>
      );
    } else if (row.inSteam) {
      tag = <TagSpan>{T(["steam.dialog.in_steam"])}</TagSpan>;
    }

    const classNames = [
      pending ? "pending" : "",
      willRemove ? "removing" : "",
      saving ? "disabled" : "",
    ].join(" ");
    return (
      <Row key={row.gameId} className={classNames}>
        <Checkbox
          checked={checked}
          disabled={saving}
          onChange={() => this.toggle(row.gameId)}
        />
        <span className="title">{row.title}</span>
        {willRemove && !row.installed ? (
          <span className="hint">{T(["steam.dialog.not_installed_hint"])}</span>
        ) : null}
        <span className="filler" />
        {this.renderModeControl(row, checked)}
        {tag}
      </Row>
    );
  }

  renderModeControl(row: RowData, checked: boolean) {
    const { saving } = this.props.modal.widgetParams;
    const hasDirectTarget = row.directTarget != null;
    // Existing direct shortcuts must always be able to switch back to
    // itch mode, even when their executable no longer resolves.
    if (
      !row.installed ||
      !checked ||
      (!hasDirectTarget && row.steamMode !== "direct")
    ) {
      return null;
    }
    const mode = this.stagedMode(row);
    const directUnavailable = mode === "itch" && !hasDirectTarget;
    return (
      <ModeButton
        type="button"
        disabled={saving || directUnavailable}
        onClick={(e) => {
          // inside the row <label>: don't toggle the checkbox
          e.preventDefault();
          e.stopPropagation();
          this.toggleMode(row.gameId);
        }}
        data-rh={JSON.stringify([
          directUnavailable
            ? "steam.dialog.mode_direct_unavailable_hint"
            : mode === "itch"
            ? "steam.dialog.mode_itch_hint"
            : "steam.dialog.mode_direct_hint",
        ])}
        data-rh-at="top"
      >
        {T([
          mode === "itch"
            ? "steam.dialog.mode_itch"
            : "steam.dialog.mode_direct",
        ])}
      </ModeButton>
    );
  }

  renderDetailsLine() {
    const { snapshot } = this.props.modal.widgetParams;
    if (!snapshot.steamRoot || !snapshot.userId) {
      return null;
    }

    let file = snapshot.shortcutsPath ?? "";
    if (file.startsWith(snapshot.steamRoot)) {
      file = file.slice(snapshot.steamRoot.length + 1);
    }

    return (
      <DetailsBox>
        <summary>
          <Icon icon="triangle-right" />
          <span>shortcuts.vdf</span>
        </summary>
        <div className="grid">
          <div className="label">{T(["steam.dialog.details.steam_root"])}</div>
          <div className="value mono" title={snapshot.steamRoot}>
            {snapshot.steamRoot}
          </div>
          <div className="label">{T(["steam.dialog.details.user"])}</div>
          <div className="value mono">{snapshot.userId}</div>
          <div className="label">{T(["steam.dialog.details.file"])}</div>
          <div className="value mono" title={snapshot.shortcutsPath ?? ""}>
            {snapshot.fileExists ? file : T(["steam.dialog.details.missing"])}
          </div>
          <div className="label">{T(["steam.dialog.details.entries"])}</div>
          <div className="value">
            {snapshot.totalEntries !== null
              ? T([
                  "steam.dialog.details.entries_value",
                  {
                    itch: snapshot.entries.length,
                    total: snapshot.totalEntries,
                  },
                ])
              : "—"}
          </div>
          <div className="label">{T(["steam.dialog.details.backup"])}</div>
          <div className="value mono">
            {snapshot.backupExists
              ? "shortcuts.vdf.itch-bak"
              : T(["steam.dialog.details.none"])}
          </div>
          <div className="label">{T(["steam.dialog.details.steam"])}</div>
          <div className={`value ${snapshot.steamRunning ? "caution" : ""}`}>
            {T([
              snapshot.steamRunning
                ? "steam.dialog.details.running"
                : "steam.dialog.details.not_running",
            ])}
          </div>
          {snapshot.fileSize !== null ? (
            <>
              <div className="label">{T(["steam.dialog.details.size"])}</div>
              <div className="value">{fileSize(snapshot.fileSize)}</div>
            </>
          ) : null}
          {snapshot.fileMtimeMs !== null ? (
            <>
              <div className="label">
                {T(["steam.dialog.details.modified"])}
              </div>
              <div className="value">
                <TimeAgo date={new Date(snapshot.fileMtimeMs)} />
              </div>
            </>
          ) : null}
        </div>
      </DetailsBox>
    );
  }

  renderFooter(rows: RowData[]) {
    const { snapshot, saving, saveProgress } = this.props.modal.widgetParams;
    const { toAdd, toRemove, toUpdate } = this.pendingChanges(rows);
    const dirty =
      toAdd.length > 0 || toRemove.length > 0 || toUpdate.length > 0;

    const parts: JSX.Element[] = [];
    if (toAdd.length > 0) {
      parts.push(
        <span className="add" key="add">
          {T(["steam.dialog.summary_add", { count: toAdd.length }])}
        </span>
      );
    }
    if (toRemove.length > 0) {
      parts.push(
        <span className="remove" key="remove">
          {T(["steam.dialog.summary_remove", { count: toRemove.length }])}
        </span>
      );
    }
    if (toUpdate.length > 0) {
      parts.push(
        <span key="update">
          {T(["steam.dialog.summary_update", { count: toUpdate.length }])}
        </span>
      );
    }

    return (
      <Footer>
        {saving ? (
          <div className="summary">
            {saveProgress && saveProgress.total > 0
              ? T([
                  "steam.dialog.saving_progress",
                  {
                    completed: saveProgress.completed,
                    total: saveProgress.total,
                  },
                ])
              : T(["steam.dialog.saving"])}
          </div>
        ) : dirty ? (
          <div className="summary">
            {parts.map((part, i) => (
              <React.Fragment key={part.key}>
                {i > 0 ? " · " : null}
                {part}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="summary clean">{T(["steam.dialog.no_changes"])}</div>
        )}
        <ModalButtons>
          <Button label={T(["prompt.action.close"])} onClick={this.onClose} />
          <ModalButtonSpacer />
          <Button
            primary
            disabled={saving || !dirty || snapshot.steamRunning}
            iconComponent={saving ? <LoadingCircle progress={-1} /> : undefined}
            label={T([saving ? "steam.dialog.saving" : "steam.dialog.save"])}
            onClick={this.onSave}
          />
        </ModalButtons>
      </Footer>
    );
  }

  /** a kept entry whose fields will be rewritten: repair or mode switch */
  rowWillUpdate(row: RowData): boolean {
    const willSwitch =
      row.installed &&
      row.steamMode !== null &&
      this.stagedMode(row) !== row.steamMode;
    return row.needsRepair || willSwitch;
  }

  pendingChanges(rows: RowData[]) {
    const { checked } = this.state;
    const toAdd = rows.filter((r) => !!checked[r.gameId] && !r.inSteam);
    const toRemove = rows.filter((r) => !checked[r.gameId] && r.inSteam);
    const toUpdate = rows.filter(
      (r) => !!checked[r.gameId] && r.inSteam && this.rowWillUpdate(r)
    );
    return { toAdd, toRemove, toUpdate };
  }

  toggle(gameId: number) {
    this.setState((state) => ({
      checked: { ...state.checked, [gameId]: !state.checked[gameId] },
    }));
  }

  toggleMode(gameId: number) {
    const row = rowsOf(this.props.modal.widgetParams).find(
      (r) => r.gameId === gameId
    );
    if (!row) {
      return;
    }
    if (this.stagedMode(row) === "itch" && !row.directTarget) {
      return;
    }
    const next: SteamShortcutMode =
      this.stagedMode(row) === "itch" ? "direct" : "itch";
    this.setState((state) => ({
      modes: { ...state.modes, [gameId]: next },
    }));
  }

  setAll(predicate: (row: RowData) => boolean | undefined) {
    const rows = rowsOf(this.props.modal.widgetParams);
    this.setState((state) => {
      const checked = { ...state.checked };
      for (const row of rows) {
        const value = predicate(row);
        if (value !== undefined) {
          checked[row.gameId] = value;
        }
      }
      return { checked };
    });
  }

  onAddInstalled = () => {
    this.setAll((row) => (row.installed ? true : undefined));
  };

  onRemoveMissing = () => {
    this.setAll((row) => (!row.installed ? false : undefined));
  };

  onRemoveAll = () => {
    this.setAll(() => false);
  };

  onSave = () => {
    if (this.props.modal.widgetParams.saving) {
      return;
    }
    const rows = rowsOf(this.props.modal.widgetParams);
    const { toAdd, toRemove, toUpdate } = this.pendingChanges(rows);
    const ensure = new Map<number, SteamShortcutMode>();
    for (const r of [...toAdd, ...toUpdate]) {
      if (r.installed) {
        ensure.set(r.gameId, this.stagedMode(r));
      }
    }
    this.props.dispatch(
      actions.steamShortcutsSave({
        ensure: [...ensure].map(([gameId, mode]) => ({ gameId, mode })),
        // uninstalled entries can't go through ensure; the repair path
        // still heals their launcher-derived fields
        repairGameIds: toUpdate.map((r) => r.gameId),
        removeGameIds: toRemove.map((r) => r.gameId),
      })
    );
  };

  onClose = () => {
    this.props.dispatch(
      actions.closeModal({ wind: ambientWind(), id: this.props.modal.id })
    );
  };
}

export default hook()(SteamShortcuts);
