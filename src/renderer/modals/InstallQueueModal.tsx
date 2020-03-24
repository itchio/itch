import { messages } from "common/butlerd";
import { Upload, Game, InstallLocationSummary } from "common/butlerd/messages";
import { modals } from "common/modals";
import React, { useState } from "react";
import { Ellipsis } from "renderer/basics/Ellipsis";
import { useSocket } from "renderer/contexts";
import { HardModal } from "renderer/modals/HardModal";
import { modalWidget } from "renderer/modals/ModalRouter";
import { useAsync } from "renderer/use-async";
import styled from "styled-components";
import { Button } from "renderer/basics/Button";
import { ErrorState } from "renderer/basics/ErrorState";
import { Dropdown } from "renderer/Dropdown";
import { formatUploadTitle } from "renderer/basics/upload";
import { FormattedMessage } from "react-intl";
import { mixins, fontSizes } from "renderer/theme";
import * as _ from "lodash";
import { fileSize } from "common/format/filesize";

export const InstallQueueModal = modalWidget(modals.installQueue, props => {
  const { gameId, uploadId } = props.params;

  const socket = useSocket();
  const [error, setError] = useState<Error | undefined>();
  const [uploads, setUploads] = useState<Upload[]>();
  const [game, setGame] = useState<Game>();

  useAsync(async () => {
    try {
      await Promise.all([
        (async () => {
          const { game } = await socket.call(messages.FetchGame, {
            gameId,
          });
          setGame(game);
        })(),
        (async () => {
          const { uploads } = await socket.call(messages.FetchGameUploads, {
            gameId,
            compatible: false,
          });
          setUploads(uploads);
        })(),
      ]);
    } catch (e) {
      console.warn(e.stack);
      setError(e);
    }
  }, []);

  if (error) {
    return <HardModal content={<ErrorState error={error} />} />;
  }

  if (game && uploads) {
    return (
      <HardModal
        title={game.title}
        content={
          <Body game={game} uploads={uploads} initialUploadId={uploadId} />
        }
      />
    );
  }

  return <HardModal content={<Ellipsis />} />;
});

interface Props {
  game: Game;
  uploads: Upload[];
  initialUploadId: number | undefined;
}

const BodyDiv = styled.div`
  width: 100%;
  height: 100%;

  display: flex;
  flex-direction: column;

  .dropdown-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 0.5em 0;

    .dropdown-label {
      ${mixins.singleLine};
      flex-basis: 30%;
    }
  }

  .buttons {
    display: flex;
    flex-direction: row;
  }

  .filler {
    flex-grow: 1;
  }
`;

const OptionDiv = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  .name {
    color: ${p => p.theme.colors.text1};
  }

  .size {
    padding-left: 1em;
    color: ${p => p.theme.colors.text2};
    font-size: ${p => fontSizes.small};
  }
`;

const Body = (props: Props) => {
  const { uploads, initialUploadId } = props;

  let getInitialUploadId = () => {
    if (_.find(uploads, u => u.id == initialUploadId)) {
      return initialUploadId;
    } else {
      return uploads[0].id;
    }
  };
  const [uploadId, setUploadId] = useState(getInitialUploadId());

  const [locs, setLocs] = useState<InstallLocationSummary[]>([]);

  const [locId, setLocId] = useState<string | undefined>();
  const socket = useSocket();
  useAsync(async () => {
    const { installLocations } = await socket.call(
      messages.InstallLocationsList,
      {}
    );
    setLocs(installLocations);
    setLocId(installLocations[0].id);
  }, [socket]);

  return (
    <BodyDiv>
      <div className="dropdowns">
        <div className="dropdown-row">
          <div className="dropdown-label">
            <FormattedMessage id="plan_install.select_upload" />
          </div>
          <Dropdown
            options={uploads.map(upload => ({
              ...upload,
              label: formatUploadTitle(upload),
              value: upload.id,
            }))}
            value={uploadId}
            width="100%"
            onChange={value => setUploadId(value)}
          />
        </div>
        <div className="dropdown-row">
          <div className="dropdown-label">
            <FormattedMessage id="plan_install.select_install_location" />
          </div>
          <Dropdown
            options={locs.map(loc => ({
              ...loc,
              label: (
                <OptionDiv>
                  <div className="name">{loc.path}</div>
                  <div className="size">{fileSize(loc.sizeInfo.freeSize)}</div>
                </OptionDiv>
              ),
              value: loc.id,
            }))}
            value={locId}
            width="100%"
            onChange={value => setLocId(value)}
          />
        </div>
      </div>
      <div className="filler" />
      <div className="buttons">
        <Button label="Cancel" />
        <div className="filler" />
        <Button label="Install" icon="install" />
      </div>
    </BodyDiv>
  );
};
