import { messages } from "common/butlerd";
import { Game } from "common/butlerd/messages";
import { gameCover } from "common/game-cover";
import { packets } from "common/packets";
import React, { useCallback, useEffect, useState, useRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Button } from "renderer/basics/Button";
import { Ellipsis } from "renderer/basics/Ellipsis";
import { IconButton } from "renderer/basics/IconButton";
import { Modal } from "renderer/basics/Modal";
import { useDebounce } from "renderer/basics/useDebounce";
import { useProfile, useSocket } from "renderer/contexts";
import { fontSizes, mixins } from "renderer/theme";
import { useAsyncCb } from "renderer/use-async-cb";
import styled from "styled-components";
import { useListen } from "renderer/Socket";
import _ from "lodash";
import { searchExamples } from "common/constants/search-examples";

const SearchModalContainer = styled(Modal)`
  width: 60vw;
  max-width: 960px;

  .modal-body {
    padding: 0;
    overflow: hidden;
    height: 60vh;
    max-height: 600px;

    display: flex;
    flex-direction: column;
  }
`;

const SearchTopBar = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 10px;
`;

const SearchInputContainer = styled.div`
  flex-grow: 1;

  border: none;
  border-bottom: 2px solid ${p => p.theme.colors.inputBorder};
  &:focus {
    border-color: ${p => p.theme.colors.inputBorderFocus};
  }

  background: ${p => p.theme.colors.inputBg};
  color: ${p => p.theme.colors.text1};
  padding: 15px 15px;

  position: relative;

  .ellipsis {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateX(-200%) translateY(-50%) scale(0.4);
  }
`;

const SearchInput = styled.input`
  width: 100%;

  color: inherit;
  border: none;
  outline: none;
  background: none;
  font-size: ${fontSizes.enormous};
`;

const SearchResults = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  flex-grow: 1;
  flex-shrink: 1;

  width: 100%;
  overflow-y: auto;
`;

let coverWidth = 290;
let coverHeight = 230;
let ratio = 0.28;

const SearchResult = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  .cover {
    width: ${coverWidth * ratio}px;
    height: ${coverHeight * ratio}px;
    background-size: cover;
    background-position: 50% 50%;
    flex-shrink: 0;

    margin-right: 10px;
  }

  margin-bottom: 10px;
  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .text-section {
    display: flex;
    flex-direction: column;
    line-height: 1.4;
    flex-shrink: 1;
    ${mixins.singleLine};

    .title {
      font-weight: 900;
      font-size: ${fontSizes.large};
    }

    .short-text {
      font-weight: normal;
      font-size: ${fontSizes.normal};
      color: ${p => p.theme.colors.text2};
      ${mixins.singleLine};
    }
  }
`;

const SearchBottomBar = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;

  height: 60px;
`;

const SearchInstruction = styled.div`
  align-self: center;
  justify-self: center;
`;

const Filler = styled.div`
  flex-grow: 1;
`;

type State = "initial" | "results" | "no-results";

export const SearchModal = (props: { onClose: () => void }) => {
  const socket = useSocket();
  const profile = useProfile();
  const { onClose } = props;

  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<State>("initial");
  const [loading, setLoading] = useState(false);
  const [example, setExample] = useState(_.sample(searchExamples));
  const [current, setCurrent] = useState(0);
  const [results, setResults] = useState<Game[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useListen(
    socket,
    packets.openSearch,
    () => {
      inputRef.current?.focus();
      inputRef.current?.select();
    },
    []
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (debouncedSearchTerm.length < 2) {
        if (cancelled) {
          return;
        }

        setCurrent(0);
        setResults([]);
        setState("initial");
        setExample(_.sample(searchExamples));
        return;
      }

      setLoading(true);
      const { games } = await socket.call(messages.SearchGames, {
        profileId: profile!.id,
        query: debouncedSearchTerm,
      });
      if (cancelled) {
        return;
      }

      setCurrent(0);
      setResults(games);
      setLoading(false);
      setState(_.isEmpty(games) ? "no-results" : "results");
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

  const onViewAll = useCallback(() => {
    onClose();
    let url = new URL("https://itch.io/search");
    url.searchParams.set("q", debouncedSearchTerm);
    socket.send(packets.navigate, { url: url.toString() });
  }, [debouncedSearchTerm, onClose]);

  const [openGame] = useAsyncCb(
    async (game: Game) => {
      props.onClose();
      let url = `itch://games/${game.id}`;
      await socket.send(packets.navigate, { url });
    },
    [socket]
  );

  const intl = useIntl();

  const renderSearchResults = () => {
    switch (state) {
      case "initial":
        return (
          <>
            <Filler />
            <SearchInstruction>
              <FormattedMessage
                id="search.empty.tagline"
                values={{ example }}
              />
            </SearchInstruction>
            <Filler />
          </>
        );
      case "no-results":
        return (
          <>
            <Filler />
            <SearchInstruction>
              <FormattedMessage id="search.empty.no_results" />
            </SearchInstruction>
            <Filler />
          </>
        );
      case "results":
        return (
          <>
            {results.map(game => {
              return (
                <SearchResult key={`${game.id}`} onClick={() => openGame(game)}>
                  <div
                    className="cover"
                    style={{ backgroundImage: `url(${gameCover(game)})` }}
                  />
                  <div className="text-section">
                    <div className="title">{game.title}</div>
                    <div className="short-text">{game.shortText}</div>
                  </div>
                </SearchResult>
              );
            })}
          </>
        );
    }
  };

  return (
    <SearchModalContainer easyClose hideTitleBar onClose={props.onClose}>
      <SearchTopBar>
        <SearchInputContainer>
          <SearchInput
            placeholder={intl.formatMessage({ id: "search.placeholder" })}
            ref={inputRef}
            type="text"
            onChange={onChange}
            onKeyDown={onKeyDown}
            autoFocus
          />
          {loading && <Ellipsis />}
        </SearchInputContainer>
      </SearchTopBar>
      <SearchResults>{renderSearchResults()}</SearchResults>
      {state === "results" && (
        <SearchBottomBar>
          <Button
            secondary
            label={<FormattedMessage id="game_stripe.view_all" />}
            onClick={onViewAll}
          />
        </SearchBottomBar>
      )}
    </SearchModalContainer>
  );
};
