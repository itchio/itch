import * as React from "react";
import { map } from "underscore";
import { Profile } from "../../../buse/messages";

import Link from "../../basics/link";

import RememberedProfile from "./remembered-profile";
import styled from "../../styles";
import format from "../../format";
import { Links } from "./links";

const RememberedProfilesDiv = styled.div`
  animation: fade-in 0.2s;

  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-y: auto;
`;

class RememberedProfiles extends React.PureComponent<IProps> {
  render() {
    const { profiles, showForm } = this.props;

    return (
      <RememberedProfilesDiv>
        {map(profiles, profile => (
          <RememberedProfile key={profile.user.id} profile={profile} />
        ))}

        <Links>
          <Link label={format(["login.action.show_form"])} onClick={showForm} />
        </Links>
      </RememberedProfilesDiv>
    );
  }
}

export default RememberedProfiles;

interface IProps {
  profiles: Profile[];
  showForm: () => void;
}
