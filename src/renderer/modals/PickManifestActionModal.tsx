import { modalWidget } from "renderer/modals/ModalRouter";
import { modals } from "common/modals";
import { HardModal } from "renderer/modals/HardModal";
import React from "react";
import { FormattedMessage } from "react-intl";
import styled from "styled-components";
import { fontSizes } from "common/theme";
import { Button } from "renderer/basics/Button";

const ActionItem = styled.div`
  flex-shrink: 0;

  display: flex;
  flex-direction: row;
  align-items: center;

  margin-top: 0.5em;
  margin-bottom: 1.5em;

  .details {
    display: flex;
    flex-direction: column;

    .secondary {
      color: ${(p) => p.theme.colors.text2};
    }

    .title {
      font-weight: bold;
      font-size: ${fontSizes.large};
      margin-bottom: 0.4em;
    }

    .spacer {
      display: inline-block;
      width: 0.4em;
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

export const PickManifestActionModal = modalWidget(
  modals.pickManifestAction,
  (props) => {
    const { onResult, params } = props;
    const { actions, game } = params;
    const { title } = game;

    return (
      <HardModal
        title={<FormattedMessage id="prompt.launch.title" values={{ title }} />}
        content={
          <>
            <p>
              <FormattedMessage id="prompt.launch.message" />
            </p>
            {actions.map((action, index) => {
              return (
                <ActionItem key={`action-${index}`}>
                  <div className="details">
                    <div className="title">
                      <FormattedMessage
                        id={`action.name.${action.name}`}
                        defaultMessage={action.name}
                      />
                    </div>
                    <div className="secondary">{action.path}</div>
                  </div>
                  <div className="filler"></div>
                  <div className="button">
                    <Button
                      icon={action.icon}
                      label={<FormattedMessage id="grid.item.launch" />}
                      onClick={() => onResult({ index })}
                    />
                  </div>
                </ActionItem>
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
      />
    );
  }
);
