import React from "react";
import { map } from "underscore";
import { Profile } from "common/butlerd/messages";

import Link from "renderer/basics/Link";

import RememberedProfile from "./RememberedProfile";
import styled from "renderer/styles";
import { T } from "renderer/t";

import watching, { Watcher } from "renderer/hocs/watching";
import { actions } from "common/actions";
import { messages, call } from "common/butlerd";
import { Links } from "renderer/scenes/GateScene/styles";

const RememberedProfilesDiv = styled.div`
  animation: fade-in 0.2s;

  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-y: auto;
`;

@watching
class RememberedProfiles extends React.PureComponent<Props> {
  render() {
    const { profiles, showForm } = this.props;

    return (
      <RememberedProfilesDiv>
        {map(profiles, profile => (
          <RememberedProfile key={profile.user.id} profile={profile} />
        ))}

        <Links>
          <Link label={T(["login.action.show_form"])} onClick={showForm} />
        </Links>
      </RememberedProfilesDiv>
    );
  }

  subscribe(watcher: Watcher) {
    watcher.on(actions.forgetProfile, async (store, action) => {
      const { profile } = action.payload;
      await call(messages.ProfileForget, { profileId: profile.id });
      store.dispatch(actions.profilesUpdated({}));
    });
  }
}

export default RememberedProfiles;

interface Props {
  profiles: Profile[];
  showForm: () => void;
}
