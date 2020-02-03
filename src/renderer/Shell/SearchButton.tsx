import React, { useState, useCallback, useEffect } from "react";
import { IconButton } from "renderer/basics/IconButton";
import { Modal } from "renderer/basics/Modal";
import { Game } from "common/butlerd/messages";
import { useSocket, useProfile } from "renderer/contexts";
import { useAsyncCb } from "renderer/use-async-cb";
import { fontSizes } from "renderer/theme";
import styled from "styled-components";
import { useDebounce } from "renderer/basics/useDebounce";
import { messages } from "common/butlerd";
import { gameCover } from "common/game-cover";
import { useListen } from "renderer/Socket";
import { packets } from "common/packets";

interface Props {}

export const SearchButton = (props: Props) => {
  const socket = useSocket();
  const [open, setOpen] = useState(false);

  useListen(
    socket,
    packets.openSearch,
    () => {
      setOpen(true);
    },
    [setOpen]
  );

  const toggleOpen = useCallback(() => {
    setOpen(o => !o);
  }, [setOpen]);

  const onClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  return (
    <>
      {open ? <SearchModal onClose={onClose} /> : null}
      <IconButton icon="search" onClick={toggleOpen} />
    </>
  );
};

const SearchInput = styled.input`
  width: 100%;

  border: 2px solid ${p => p.theme.colors.inputBorder};
  &:focus {
    border-color: ${p => p.theme.colors.inputBorderFocus};
  }
  background: ${p => p.theme.colors.inputBg};
  font-size: ${fontSizes.excessive};
  color: ${p => p.theme.colors.text1};
  padding: 0.2em;

  margin-bottom: 10px;
`;

const SearchResults = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;

  width: 100%;
  height: 50vh;
  overflow-y: scroll;
`;

const SearchResult = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  img.cover {
    width: 70px;
    height: 42px;
    margin-right: 10px;
  }

  padding: 4px;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const SearchModalContainer = styled(Modal)`
  width: 60vw;
  max-width: 960px;
`;

const SearchModal = (props: { onClose: () => void }) => {
  const socket = useSocket();
  const profile = useProfile();
  const { onClose } = props;

  const [results, setResults] = useState<Game[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    (async () => {
      if (debouncedSearchTerm.length < 3) {
        setResults([]);
        return;
      }

      const { games } = await socket.call(messages.SearchGames, {
        profileId: profile!.id,
        query: debouncedSearchTerm,
      });
      setResults(games);
    })().catch(e => console.warn(e.stack));
  }, [debouncedSearchTerm]);

  const [onChange] = useAsyncCb(
    async (ev: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(ev.currentTarget.value);
    },
    [socket, profile]
  );

  const onKeyDown = useCallback(
    (ev: React.KeyboardEvent<HTMLInputElement>) => {
      if (ev.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <SearchModalContainer>
      <SearchInput
        type="search"
        onChange={onChange}
        onKeyDown={onKeyDown}
        autoFocus
      />
      <SearchResults>
        {results.map(game => {
          return (
            <SearchResult key={`${game.id}`}>
              <img className="cover" src={gameCover(game)} /> {game.title}
            </SearchResult>
          );
        })}
      </SearchResults>
    </SearchModalContainer>
  );
};
