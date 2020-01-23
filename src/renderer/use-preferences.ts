import { useEffect, useState } from "react";
import { useSocket } from "renderer/contexts";
import { PreferencesState } from "common/preferences";
import { useAsync } from "renderer/use-async";
import { queries } from "common/queries";
import { useListen } from "renderer/Socket";
import { packets } from "common/packets";

export function usePreferences(): PreferencesState | undefined {
  const socket = useSocket();
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
      setPreferences(old => (old ? { ...old, ...preferences } : old));
    },
    []
  );

  return preferences;
}
