import { packets } from "common/packets";
import { PreferencesState } from "common/preferences";
import { queries } from "common/queries";
import { useState } from "react";
import { useListen } from "renderer/Socket";
import { useAsync } from "renderer/use-async";
import { socket } from "renderer";

export function usePreferences(): PreferencesState | undefined {
  const [preferences, setPreferences] = useState<PreferencesState | undefined>(
    undefined
  );

  useAsync(async () => {
    const { preferences } = await socket.query(queries.getPreferences);
    setPreferences(preferences);
  }, []);

  useListen(
    socket,
    packets.preferencesUpdated,
    ({ preferences }) => {
      setPreferences((old) => (old ? { ...old, ...preferences } : old));
    },
    []
  );

  return preferences;
}
