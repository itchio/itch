import { actions } from "common/actions";
import * as messages from "common/butlerd/messages";
import { Game, Profile } from "common/butlerd/messages";
import { fileSize } from "common/format/filesize";
import { ModalWidgetProps } from "common/modals";
import {
  SteamSyncSetupParams,
  SteamSyncSetupResponse,
} from "common/modals/types";
import { Dispatch, RootState, SteamSyncConnection } from "common/types";
import { ambientWind } from "common/util/navigation";
import { lighten, transparentize } from "polished";
import React from "react";
import Button from "renderer/basics/Button";
import Icon from "renderer/basics/Icon";
import LoadingCircle from "renderer/basics/LoadingCircle";
import { ModalButtons } from "renderer/basics/modal-styles";
import butlerCaller from "renderer/hocs/butlerCaller";
import { hookWithProps } from "renderer/hocs/hook";
import GamePicker from "renderer/modal-widgets/PushBuild/GamePicker";
import { targetForGame } from "renderer/modal-widgets/PushBuild/target";
import { ModalWidgetDiv } from "renderer/modal-widgets/styles";
import styled from "renderer/styles";
import { T } from "renderer/t";

const FetchPlan = butlerCaller(messages.PublishSteamSyncPlan);

const Buttons = styled(ModalButtons)`
  gap: 8px;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 640px;
  max-width: 90vw;
`;

const Intro = styled.div`
  color: ${(props) => props.theme.secondaryText};
  line-height: 1.5;
`;

const Field = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 8px 0;

  label {
    margin-right: 12px;
    color: ${(props) => props.theme.secondaryText};
  }

  select,
  input {
    flex: 1;
    padding: 6px 8px;
    background: ${(props) => props.theme.inputBackground};
    color: ${(props) => props.theme.baseText};
    border: 1px solid ${(props) => props.theme.inputBorder};
    border-radius: 2px;
    font-size: ${(props) => props.theme.fontSizes.baseText};
  }
`;

const PlanBox = styled.div`
  border: 1px solid ${(props) => props.theme.inputBorder};
  border-radius: 4px;
  background: ${(props) => props.theme.itemBackground};
  max-height: 40vh;
  overflow-y: auto;
`;

const Center = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 20px;
  color: ${(props) => props.theme.secondaryText};
`;

const Channel = styled.div`
  padding: 10px 14px;
  border-bottom: 1px solid ${(props) => props.theme.inputBorder};

  &:last-child {
    border-bottom: none;
  }
`;

const ChannelHead = styled.div`
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 10px;
  font-weight: bold;
`;

const Dim = styled.span`
  color: ${(props) => props.theme.secondaryText};
  font-size: ${(props) => props.theme.fontSizes.smaller};
  font-weight: normal;
`;

const Depot = styled.div`
  display: grid;
  grid-template-columns: 80px 1fr auto;
  gap: 12px;
  padding: 3px 0 0 12px;
  color: ${(props) => props.theme.secondaryText};
  font-size: ${(props) => props.theme.fontSizes.smaller};
`;

const Callout = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 4px;
  background: ${(props) => transparentize(0.88, props.theme.error)};
  border: 1px solid ${(props) => transparentize(0.65, props.theme.error)};
  color: ${(props) => props.theme.baseText};
  line-height: 1.45;

  .icon {
    color: ${(props) => lighten(0.08, props.theme.error)};
    margin-top: 2px;
    font-size: 110%;
  }
`;

const Spacer = styled.div`
  flex: 1;
`;

interface Props
  extends ModalWidgetProps<SteamSyncSetupParams, SteamSyncSetupResponse> {
  dispatch: Dispatch;
  profile: Profile | null;
}

interface State {
  gameId: number | null;
  gameTitle: string;
  target: string;
  branch: string;
  password: string;
  /** password the plan was last fetched with, so typing does not refetch */
  planPassword: string;
  branches: messages.PublishSteamSyncBranch[];
}

class SteamSyncSetup extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    const c = props.modal.widgetParams.connection;
    this.state = {
      gameId: c?.gameId ?? null,
      gameTitle: c?.gameTitle ?? "",
      target: c?.target ?? "",
      branch: c?.branch ?? "public",
      password: "",
      planPassword: "",
      branches: [],
    };
  }

  override render() {
    const { profile } = this.props;
    if (!profile) return null;
    const { app, connection } = this.props.modal.widgetParams;
    const { gameId, target, branch, password, planPassword, branches } =
      this.state;
    const current = branches.find((b) => b.name === branch);
    const needsPassword = current?.passwordRequired ?? false;

    return (
      <ModalWidgetDiv>
        <Container>
          <Intro>{T(["steam_sync.setup.intro", { name: app.name }])}</Intro>
          <GamePicker
            profile={profile}
            selectedGameId={gameId}
            onChange={this.onGameChange}
          />
          <Field>
            <label htmlFor="steam-sync-branch">
              {T(["steam_sync.setup.branch"])}
            </label>
            <select
              id="steam-sync-branch"
              value={branch}
              onChange={this.onBranchChange}
              disabled={branches.length === 0}
            >
              {branches.length === 0 ? (
                <option value={branch}>{branch}</option>
              ) : (
                branches.map((b) => (
                  <option key={b.name} value={b.name}>
                    {b.name}
                    {b.passwordRequired ? " (password)" : ""}
                  </option>
                ))
              )}
            </select>
          </Field>
          {needsPassword ? (
            <Field>
              <label htmlFor="steam-sync-password">
                {T(["steam_sync.setup.password"])}
              </label>
              <input
                id="steam-sync-password"
                type="password"
                value={password}
                onChange={this.onPasswordChange}
                onBlur={this.applyPassword}
                onKeyDown={this.onPasswordKey}
              />
            </Field>
          ) : null}
          {target ? (
            <FetchPlan
              params={{
                appId: app.id,
                target,
                branch,
                password: needsPassword ? planPassword : "",
              }}
              loadingHandled
              errorsHandled
              onResult={this.onPlan}
              render={this.renderPlan}
            />
          ) : (
            <PlanBox>
              <Center>{T(["steam_sync.setup.pick_project"])}</Center>
            </PlanBox>
          )}
          <Buttons>
            {connection ? (
              <Button onClick={this.onRemove}>
                {T(["steam_sync.setup.remove"])}
              </Button>
            ) : null}
            <Spacer />
            <Button onClick={this.onClose}>
              {T(["prompt.action.cancel"])}
            </Button>
            <Button disabled={!target} onClick={this.onSave}>
              {T(["steam_sync.setup.save"])}
            </Button>
            <Button
              primary
              disabled={!target || (needsPassword && !password)}
              onClick={this.onSaveAndSync}
            >
              {T(["steam_sync.setup.save_and_sync"])}
            </Button>
          </Buttons>
        </Container>
      </ModalWidgetDiv>
    );
  }

  renderPlan = ({
    loading,
    error,
    result,
  }: {
    loading: boolean;
    error: Error | undefined;
    result: messages.PublishSteamSyncPlanResult | undefined;
  }) => {
    if (error) {
      return (
        <Callout>
          <Icon icon="error" />
          <span>{error.message}</span>
        </Callout>
      );
    }
    if (loading || !result) {
      return (
        <PlanBox>
          <Center>
            <LoadingCircle progress={-1} bare />
            {T(["steam_sync.setup.planning"])}
          </Center>
        </PlanBox>
      );
    }
    const { plan } = result;
    return (
      <>
        <PlanBox>
          {plan.channels.map((ch) => (
            <Channel key={ch.name}>
              <ChannelHead>
                {plan.target}:{ch.name}
                <Dim>{fileSize(ch.size)}</Dim>
              </ChannelHead>
              {ch.depots.map((d) => (
                <Depot key={d.id}>
                  <span>{d.id}</span>
                  <span>{d.name}</span>
                  <span>{fileSize(d.size)}</span>
                </Depot>
              ))}
            </Channel>
          ))}
          {plan.skipped.length > 0 ? (
            <Channel>
              <ChannelHead>
                <Dim>{T(["steam_sync.setup.skipped"])}</Dim>
              </ChannelHead>
              {plan.skipped.map((d) => (
                <Depot key={d.id}>
                  <span>{d.id}</span>
                  <span>{d.name}</span>
                  <span>{d.reason}</span>
                </Depot>
              ))}
            </Channel>
          ) : null}
        </PlanBox>
        {plan.warnings.map((w, i) => (
          <Callout key={i}>
            <Icon icon="error" />
            <span>{w}</span>
          </Callout>
        ))}
        <Intro>
          {T(["steam_sync.setup.build", { buildId: plan.buildId }])}
        </Intro>
      </>
    );
  };

  onPlan = (res: messages.PublishSteamSyncPlanResult) => {
    this.setState({ branches: res.plan.branches });
  };

  onGameChange = (game: Game | null) => {
    if (!game) {
      this.setState({ gameId: null, gameTitle: "", target: "" });
      return;
    }
    this.setState({
      gameId: game.id,
      gameTitle: game.title,
      target: targetForGame(game),
    });
  };

  onBranchChange = (ev: React.ChangeEvent<HTMLSelectElement>) => {
    this.setState({ branch: ev.target.value, password: "", planPassword: "" });
  };

  onPasswordChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ password: ev.target.value });
  };

  onPasswordKey = (ev: React.KeyboardEvent<HTMLInputElement>) => {
    if (ev.key === "Enter") {
      this.applyPassword();
    }
  };

  applyPassword = () => {
    this.setState({ planPassword: this.state.password });
  };

  connection(): SteamSyncConnection | null {
    const { profile } = this.props;
    const { app, connection } = this.props.modal.widgetParams;
    const { gameId, gameTitle, target, branch, branches } = this.state;
    if (!profile || !gameId || !target) {
      return null;
    }
    const current = branches.find((b) => b.name === branch);
    return {
      ...connection,
      profileId: profile.id,
      steamAppId: app.id,
      steamAppName: app.name,
      gameId,
      gameTitle,
      target,
      branch,
      passwordRequired: current?.passwordRequired ?? false,
    };
  }

  onSave = () => {
    const connection = this.connection();
    if (!connection) return;
    this.props.dispatch(actions.steamSyncSaveConnection({ connection }));
    this.onClose();
  };

  onSaveAndSync = () => {
    const connection = this.connection();
    if (!connection) return;
    this.props.dispatch(actions.steamSyncSaveConnection({ connection }));
    this.props.dispatch(
      actions.steamSyncRun({ connection, password: this.state.password })
    );
    this.onClose();
  };

  onRemove = () => {
    const { profile } = this.props;
    const { app } = this.props.modal.widgetParams;
    if (!profile) return;
    this.props.dispatch(
      actions.steamSyncRemoveConnection({
        profileId: profile.id,
        steamAppId: app.id,
      })
    );
    this.onClose();
  };

  onClose = () => {
    this.props.dispatch(
      actions.closeModal({ wind: ambientWind(), id: this.props.modal.id })
    );
  };
}

export default hookWithProps(SteamSyncSetup)((map) => ({
  profile: map((rs: RootState) => rs.profile?.profile ?? null),
}))(SteamSyncSetup);
