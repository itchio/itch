import React from "react";
import { Game, Profile } from "common/butlerd/messages";
import * as messages from "common/butlerd/messages";
import ErrorState from "renderer/basics/ErrorState";
import LoadingState from "renderer/basics/LoadingState";
import { useButlerd } from "renderer/hooks/useButlerd";
import styled from "renderer/styles";
import { T, _ } from "renderer/t";

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

const GamePicker = ({ profile, selectedGameId, onChange }: Props) => {
  const { loading, error, result } = useButlerd(messages.FetchProfileGames, {
    profileId: profile.id,
  });

  if (loading && !result) {
    return <LoadingState />;
  }
  if (error) {
    return <ErrorState error={error} />;
  }

  const games = result?.items?.map((pg) => pg.game) ?? [];

  const handleChange = (ev: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(ev.target.value, 10);
    onChange(games.find((g) => g.id === id) ?? null);
  };

  return (
    <Wrapper>
      <Label htmlFor="upload-game-picker">{T(_("upload.pick_game"))}</Label>
      <Select
        id="upload-game-picker"
        value={selectedGameId ?? ""}
        onChange={handleChange}
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
};

export default GamePicker;
