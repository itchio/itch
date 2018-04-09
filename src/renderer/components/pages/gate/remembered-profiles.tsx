import React from "react";
import { map } from "underscore";
import { Profile } from "common/butlerd/messages";

import Link from "../../basics/link";

import RememberedProfile from "./remembered-profile";
import styled from "../../styles";
import { T } from "renderer/t";
import { Links } from "./links";

import watching, { Watcher } from "../../watching";
import { actions } from "common/actions";
import { messages, call } from "common/butlerd";

const RememberedProfilesDiv = styled.div`
  animation: fade-in 0.2s;

  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-y: auto;
`;

@watching
class RememberedProfiles extends React.PureComponent<IProps> {
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

interface IProps {
  profiles: Profile[];
  showForm: () => void;
}
