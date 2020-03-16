import { packets } from "common/packets";
import { PreferencesState } from "common/preferences";
import { queries } from "common/queries";
import { useState } from "react";
import { useSocket } from "renderer/contexts";
import { useListen } from "renderer/Socket";
import { useAsync } from "renderer/use-async";

export function usePreferences(): PreferencesState | undefined {
  const socket = useSocket();
  const [preferences, setPreferences] = useState<PreferencesState | undefined>(
    undefined
  );

  useAsync(async () => {
    const { preferences } = await socket.query(queries.getPreferences);
    setPreferences(preferences);
  }, [socket]);

  useListen(
    socket,
    packets.preferencesUpdated,
    ({ preferences }) => {
      setPreferences(old => (old ? { ...old, ...preferences } : old));
    },
    []
  );

  return preferences;
}
