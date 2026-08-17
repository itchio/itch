import { actions } from "common/actions";
import * as messages from "common/butlerd/messages";
import { Profile } from "common/butlerd/messages";
import React, { useCallback, useEffect, useState } from "react";
import LoadingCircle from "renderer/basics/LoadingCircle";
import { rcall } from "renderer/butlerd/rcall";
import { doAsync } from "renderer/helpers/doAsync";
import { useWatcher } from "renderer/hooks/useWatcher";
import LoginForm from "renderer/scenes/GateScene/LoginForm";
import RememberedProfiles from "renderer/scenes/GateScene/RememberedProfiles";

const LoginScreen = () => {
  const [{ loading, profiles }, setProfilesState] = useState({
    loading: true,
    profiles: [] as Profile[],
  });
  const [showingSaved, setShowingSaved] = useState(true);

  const refresh = useCallback(() => {
    doAsync(async () => {
      const { profiles } = await rcall(messages.ProfileList, {});
      // butlerd returns null for an empty profile list
      setProfilesState({ loading: false, profiles: profiles ?? [] });
      if (!profiles || profiles.length === 0) {
        setShowingSaved(false);
      }
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useWatcher((watcher) => {
    watcher.on(actions.profilesUpdated, async () => {
      refresh();
    });
    watcher.on(actions.loginFailed, async () => {
      setShowingSaved(false);
    });
  });

  const showForm = useCallback(() => setShowingSaved(false), []);
  const showSaved = useCallback(() => setShowingSaved(true), []);

  if (loading) {
    return <LoadingCircle progress={-1} wide />;
  }

  if (showingSaved) {
    return <RememberedProfiles profiles={profiles} showForm={showForm} />;
  }
  return <LoginForm showSaved={showSaved} />;
};

export default LoginScreen;
