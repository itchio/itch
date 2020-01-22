import { modals } from "common/modals";
import _ from "lodash";
import React from "react";
import { FormattedMessage } from "react-intl";
import { Button } from "renderer/basics/Button";
import { formatUploadTitle, uploadIcon } from "renderer/basics/upload";
import { HardModal } from "renderer/modals/HardModal";
import { modalWidget } from "renderer/modals/ModalRouter";
import styled from "styled-components";
import { TimeAgo } from "renderer/basics/TimeAgo";
import { Icon } from "renderer/basics/Icon";
import { fontSizes } from "renderer/theme";
import { fileSize } from "common/format/filesize";

const CaveItem = styled.div`
  flex-shrink: 0;

  display: flex;
  flex-direction: row;

  margin-top: 0.5em;
  margin-bottom: 1.5em;

  .details {
    display: flex;
    flex-direction: column;

    .title {
      font-weight: bold;
      font-size: ${fontSizes.large};
      margin-bottom: 0.4em;
    }

    .icon {
      margin-right: 0.4em;
    }
  }

  .filler {
    flex-grow: 1;
    flex-basis: 15px;
    flex-shrink: 0;
  }

  .button {
    flex-shrink: 0;
  }
`;

export const PickCaveModal = modalWidget(modals.pickCave, props => {
  const { params, onResult } = props;
  const items = _.sortBy(params.items, i => -new Date(i.stats.lastTouchedAt));
  const firstCave = _.first(params.items);
  const title = firstCave?.game?.title ?? "game";

  return (
    <HardModal
      title={<FormattedMessage id="prompt.launch.title" values={{ title }} />}
      content={
        <>
          <p>
            <FormattedMessage id="prompt.launch.message" />
          </p>
          {items.map((cave, index) => {
            let icon = uploadIcon(cave.upload);
            return (
              <CaveItem key={cave.id} onClick={() => onResult({ index })}>
                <div className="details">
                  <div className="title">{formatUploadTitle(cave.upload)}</div>
                  <div>
                    {icon ? <Icon icon={icon} /> : null}
                    {fileSize(cave.installInfo.installedSize)}
                    <FormattedMessage
                      id="usage_stats.last_used_time_ago"
                      values={{
                        time_ago: <TimeAgo date={cave.stats.lastTouchedAt} />,
                      }}
                    />
                  </div>
                </div>
                <div className="filler"></div>
                <div className="button">
                  <Button
                    label={<FormattedMessage id="grid.item.launch" />}
                    onClick={() => props.onResult({ index })}
                  />
                </div>
              </CaveItem>
            );
          })}
        </>
      }
      buttons={
        <Button
          secondary
          label={<FormattedMessage id="prompt.action.cancel" />}
          onClick={() => window.close()}
        />
      }
    ></HardModal>
  );
});
