import { modalWidget } from "renderer/modals/ModalRouter";
import { modals } from "common/modals";
import { HardModal } from "renderer/modals/HardModal";
import React, { useCallback } from "react";
import { usePreferences } from "renderer/use-preferences";
import { Dropdown } from "renderer/Dropdown";
import { useAsyncCb } from "renderer/use-async-cb";
import { useSocket } from "renderer/contexts";
import { queries } from "common/queries";
import locales from "static/locales.json";
import { FormattedMessage } from "react-intl";
import styled from "styled-components";
import { fontSizes } from "renderer/theme";
import { Icon } from "renderer/basics/Icon";

const HardPrefModal = styled(HardModal)`
  .pref-section {
    display: flex;
    flex-direction: row;
    align-items: center;

    .spacer {
      flex-basis: 10px;
      flex-shrink: 0;
    }
  }
`;

const PreferencesTitle = styled.div`
  font-size: ${fontSizes.large};
  font-weight: 800;
  margin-top: 1em;
  margin-bottom: 1em;
`;

export const PreferencesModal = modalWidget(modals.preferences, props => {
  const socket = useSocket();
  const preferences = usePreferences();

  const [onLang] = useAsyncCb(async (lang: string) => {
    await socket.query(queries.switchLanguage, {
      lang,
    });
  }, []);

  return (
    <HardPrefModal
      title={<FormattedMessage id="sidebar.preferences" />}
      content={
        <>
          <PreferencesTitle>
            <FormattedMessage id="preferences.language" />
          </PreferencesTitle>
          <div className="pref-section">
            <Icon icon="earth" />
            <div className="spacer" />
            <Dropdown
              className="lang-dropdown"
              width={320}
              onChange={lang => onLang(lang)}
              options={[
                {
                  label: (
                    <FormattedMessage
                      id="preferences.language.auto"
                      values={{ language: window.navigator.language }}
                    />
                  ),
                  value: "__",
                },
                ...locales.locales,
              ]}
              value={preferences?.lang || "en"}
            />
          </div>
          <pre>{JSON.stringify(preferences, null, 2)}</pre>
        </>
      }
    />
  );
});
