import * as React from "react";
import { map, isEmpty } from "underscore";
import { messages, call } from "../../../buse";
import { doAsync } from "../../do-async";
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
  constructor(props: RememberedProfiles["props"], context) {
    super(props, context);
    this.state = {
      loading: true,
      profiles: [],
    };
  }

  componentDidMount() {
    doAsync(async () => {
      const { profiles } = await call(messages.ProfileList, {});
      this.setState({ loading: false, profiles });

      if (isEmpty(profiles)) {
        // FIXME: that's just not good.
        this.props.loginStopPicking({});
      }
    });
  }

  render() {
    const { loading, profiles } = this.state;
    if (loading) {
      return <LoadingCircle progress={-1} wide />;
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
