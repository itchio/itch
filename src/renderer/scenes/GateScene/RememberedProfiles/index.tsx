import { actions } from "common/actions";
import * as messages from "common/butlerd/messages";
import { Profile } from "common/butlerd/messages";
import React from "react";
import Link from "renderer/basics/Link";
import { rcall } from "renderer/butlerd/rcall";
import { useWatcher } from "renderer/hooks/useWatcher";
import { Links } from "renderer/scenes/GateScene/styles";
import styled from "renderer/styles";
import { T } from "renderer/t";
import RememberedProfile from "renderer/scenes/GateScene/RememberedProfiles/RememberedProfile";

const RememberedProfilesDiv = styled.div.withConfig({
  displayName: "RememberedProfilesDiv",
})`
  animation: fade-in 0.2s;

  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  overflow-y: auto;
`;

interface Props {
  profiles: Profile[];
  showForm: () => void;
}

const RememberedProfiles = ({ profiles, showForm }: Props) => {
  useWatcher((watcher) => {
    watcher.on(actions.forgetProfile, async (store, action) => {
      const { profile } = action.payload;
      await rcall(messages.ProfileForget, { profileId: profile.id });
      store.dispatch(actions.profilesUpdated({}));
    });
  });

  return (
    <RememberedProfilesDiv>
      {profiles.map((profile) => (
        <RememberedProfile key={profile.user.id} profile={profile} />
      ))}

      <Links>
        <Link label={T(["login.action.show_form"])} onClick={showForm} />
      </Links>
    </RememberedProfilesDiv>
  );
};

export default RememberedProfiles;
