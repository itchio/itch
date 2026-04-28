import React from "react";
import { Game, Profile } from "common/butlerd/messages";
import * as messages from "common/butlerd/messages";
import butlerCaller from "renderer/hocs/butlerCaller";
import styled from "renderer/styles";
import { T, _ } from "renderer/t";

const FetchProfileGames = butlerCaller(messages.FetchProfileGames);

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 8px 0;
`;

const Label = styled.label`
  margin-right: 12px;
  color: ${(props) => props.theme.secondaryText};
`;

const Select = styled.select`
  flex: 1;
  padding: 6px 8px;
  background: ${(props) => props.theme.inputBackground};
  color: ${(props) => props.theme.baseText};
  border: 1px solid ${(props) => props.theme.inputBorder};
  border-radius: 2px;
  font-size: ${(props) => props.theme.fontSizes.baseText};
`;

interface Props {
  profile: Profile;
  selectedGameId: number | null;
  onChange: (game: Game | null) => void;
}

export default class GamePicker extends React.PureComponent<Props> {
  override render() {
    const { profile } = this.props;

    return (
      <FetchProfileGames
        params={{ profileId: profile.id }}
        render={({ result }) => {
          const games = result?.items?.map((pg) => pg.game) ?? [];
          return (
            <Wrapper>
              <Label htmlFor="upload-game-picker">
                {T(_("upload.pick_game"))}
              </Label>
              <Select
                id="upload-game-picker"
                value={this.props.selectedGameId ?? ""}
                onChange={this.handleChange(games)}
              >
                <option value="">
                  {games.length === 0
                    ? "(no games on this account)"
                    : "— select a game —"}
                </option>
                {games.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </Select>
            </Wrapper>
          );
        }}
      />
    );
  }

  handleChange =
    (games: Game[]) => (ev: React.ChangeEvent<HTMLSelectElement>) => {
      const id = parseInt(ev.target.value, 10);
      const game = games.find((g) => g.id === id) ?? null;
      this.props.onChange(game);
    };
}
