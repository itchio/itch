import { actions } from "common/actions";
import { messages } from "common/butlerd";
import { Profile } from "common/butlerd/messages";
import React from "react";
import Link from "renderer/basics/Link";
import { rcall } from "renderer/butlerd/rcall";
import watching, { Watcher } from "renderer/hocs/watching";
import { Links } from "renderer/scenes/GateScene/styles";
import styled from "renderer/styles";
import { T } from "renderer/t";
import { map } from "underscore";
import RememberedProfile from "renderer/scenes/GateScene/RememberedProfiles/RememberedProfile";

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
        {map(profiles, (profile) => (
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
      await rcall(messages.ProfileForget, { profileId: profile.id });
      store.dispatch(actions.profilesUpdated({}));
    });
  }
}

export default RememberedProfiles;

interface Props {
  profiles: Profile[];
  showForm: () => void;
}
