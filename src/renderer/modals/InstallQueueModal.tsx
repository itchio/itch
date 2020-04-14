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
import { UploadTitle } from "renderer/basics/upload";
import { FormattedMessage } from "react-intl";
import { mixins, fontSizes } from "renderer/theme";
import * as _ from "lodash";
import { fileSize } from "common/format/filesize";
import { delay } from "common/delay";
import { Center } from "renderer/basics/Center";

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
          // testing reflows
          await delay(1000);
          setGame(game);
        })(),
        // TODO: fetch both incompatibles and compatibles, show compatibles first.
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
  }, [gameId, socket]);

  if (error) {
    return <HardModal content={<ErrorState error={error} />} />;
  }

  if (game && uploads) {
    return (
      <Body
        game={game}
        uploads={uploads}
        initialUploadId={uploadId}
        onClose={() => props.onResult({})}
      />
    );
  }

  return (
    <HardModal
      content={
        <Center>
          <Ellipsis />
        </Center>
      }
    />
  );
});

interface Props {
  game: Game;
  uploads: Upload[];
  initialUploadId: number | undefined;
  onClose: () => void;
}

const BodyDiv = styled.div`
  width: 100%;
  flex-shrink: 0;

  display: flex;
  flex-direction: column;

  .dropdown-row {
    flex-shrink: 0;
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

const OptionGroup = styled.div`
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

const StatRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  padding: 1em 0;

  .name {
    color: ${p => p.theme.colors.text1};
  }

  .value {
    padding-left: 1em;
    color: ${p => p.theme.colors.text2};
    font-size: ${fontSizes.small};
  }
`;

const Body = (props: Props) => {
  const { game, uploads, initialUploadId } = props;
  const socket = useSocket();

  let getInitialUploadId = () => {
    if (_.find(uploads, u => u.id == initialUploadId)) {
      return initialUploadId;
    } else if (uploads[0]) {
      return uploads[0].id;
    } else {
      return -1;
    }
  };
  const [uploadId, setUploadId] = useState(getInitialUploadId());
  const upload = _.find(uploads, u => u.id == uploadId);

  const [locs, setLocs] = useState<InstallLocationSummary[]>([]);
  const [locId, setLocId] = useState<string | undefined>();
  const loc = _.find(locs, l => l.id == locId);
  const availableSize = loc ? loc.sizeInfo.freeSize : 0;

  useAsync(async () => {
    const { installLocations } = await socket.call(
      messages.InstallLocationsList,
      {}
    );
    setLocs(installLocations);
    setLocId(installLocations[0].id);
  }, [socket]);

  const [neededSize, setNeededSize] = useState(0);
  useAsync(async () => {
    // TODO: fetch ScannedArchive
    setNeededSize(upload ? upload.size * 1.3 : 0);
  }, [upload]);

  // TODO: add option to add install location

  return (
    <HardModal
      title={game.title}
      content={
        <BodyDiv>
          {_.isEmpty(uploads) ? (
            <p>There are no uploads available for install</p>
          ) : (
            <>
              <div className="dropdowns">
                <div className="dropdown-row">
                  <div className="dropdown-label">
                    <FormattedMessage id="plan_install.select_upload" />
                  </div>
                  <Dropdown
                    options={uploads.map(upload => ({
                      ...upload,
                      label: (
                        <OptionGroup>
                          <UploadTitle upload={upload} showSize />
                        </OptionGroup>
                      ),
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
                        <OptionGroup>
                          <div className="name">{loc.path}</div>
                          <div className="size">
                            {fileSize(loc.sizeInfo.freeSize)}
                          </div>
                        </OptionGroup>
                      ),
                      value: loc.id,
                    }))}
                    value={locId}
                    width="100%"
                    onChange={value => setLocId(value)}
                  />
                </div>
                <StatRow>
                  <div className="name">Disk space required</div>
                  <div className="value">
                    {!!neededSize ? fileSize(neededSize) : "?"}
                  </div>
                </StatRow>
                <StatRow>
                  <div className="name">Disk space available</div>
                  <div className="value">{fileSize(availableSize)}</div>
                </StatRow>
              </div>
            </>
          )}
        </BodyDiv>
      }
      buttons={
        <>
          <Button
            label={<FormattedMessage id="prompt.action.cancel" />}
            onClick={props.onClose}
            secondary
          />
          <Button
            label={<FormattedMessage id="prompt.action.install" />}
            icon="install"
          />
        </>
      }
    />
  );
};
