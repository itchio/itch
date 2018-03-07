import * as React from "react";
import { map, isEmpty } from "underscore";
import rootLogger from "../../../logger";
import { withButlerClient, messages } from "../../../buse";
import { Profile } from "../../../buse/messages";

import Link from "../../basics/link";
import LoadingCircle from "../../basics/loading-circle";

import RememberedProfile from "./remembered-profile";
import styled from "../../styles";
import format from "../../format";
import { actionCreatorsList, Dispatchers, connect } from "../../connect";
import { Links } from "./links";

const RememberedProfilesDiv = styled.div`
  animation: fade-in 0.2s;

  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-y: auto;
`;

export class RememberedProfiles extends React.PureComponent<
  IProps & IDerivedProps,
  IState
> {
  constructor() {
    super();
    this.state = {
      loading: true,
      profiles: [],
    };
  }

  componentDidMount() {
    const logger = rootLogger.child({ name: "remembered-profiles" });
    withButlerClient(logger, async client => {
      const res = await client.call(messages.ProfileList({}));
      this.setState({
        loading: false,
        profiles: res.profiles,
      });
    }).catch(e => console.error(e));
  }

  render() {
    const { loading, profiles } = this.state;
    if (loading) {
      return <LoadingCircle progress={-1} wide />;
    }

    if (isEmpty(profiles)) {
      return <p>No saved profiles</p>;
    }

    const { loginStopPicking } = this.props;

    return (
      <RememberedProfilesDiv>
        {map(profiles, profile => (
          <RememberedProfile key={profile.user.id} profile={profile} />
        ))}

        <Links>
          <Link
            label={format(["login.action.show_form"])}
            onClick={() => loginStopPicking({})}
          />
        </Links>
      </RememberedProfilesDiv>
    );
  }
}

// props

interface IState {
  loading: boolean;
  profiles: Profile[];
}

interface IProps {}

const actionCreators = actionCreatorsList("loginStopPicking");

type IDerivedProps = Dispatchers<typeof actionCreators>;

export default connect<IProps>(RememberedProfiles, { actionCreators });
