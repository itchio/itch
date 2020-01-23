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
import { AllowSandboxSetup } from "common/butlerd/messages";

export const PreferencesModal = modalWidget(modals.preferences, props => {
  const socket = useSocket();
  const preferences = usePreferences();

  const [onLang] = useAsyncCb(async (lang: string) => {
    await socket.query(queries.switchLanguage, {
      lang,
    });
  }, []);

  return (
    <HardModal
      title="Preferences"
      content={
        <>
          <p>Some preferences yeah?</p>
          <Dropdown
            onChange={onLang}
            options={[
              { label: "System language ()", value: "__" },
              ...locales.locales,
            ]}
            value={preferences?.lang || "en"}
          />
          <pre>{JSON.stringify(preferences, null, 2)}</pre>
        </>
      }
    />
  );
});
