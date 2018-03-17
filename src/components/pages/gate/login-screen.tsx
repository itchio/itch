import * as React from "react";

import { actionCreatorsList, Dispatchers, connect } from "../../connect";

import { Profile } from "../../../buse/messages";
import { messages, call } from "../../../buse";
import { doAsync } from "../../do-async";

import { isEmpty } from "underscore";

import RememberedProfiles from "./remembered-profiles";
import LoginForm from "./login-form";

import watching, { Watcher } from "../../watching";
import { actions } from "../../../actions";
import LoadingCircle from "../../basics/loading-circle";

@watching
class LoginScreen extends React.PureComponent<IProps & IDerivedProps, IState> {
  constructor(props: LoginScreen["props"], context) {
    super(props, context);
    this.state = {
      loading: true,
      showingSaved: true,
      profiles: [],
    };
  }

  componentDidMount() {
    this.refresh();
  }

  subscribe(watcher: Watcher) {
    watcher.on(actions.profilesUpdated, async (store, action) => {
      this.refresh();
    });
    watcher.on(actions.loginFailed, async (store, action) => {
      this.showForm();
    });
  }

  refresh() {
    doAsync(async () => {
      const { profiles } = await call(messages.ProfileList, {});
      this.setState({ loading: false, profiles });

      if (isEmpty(profiles)) {
        this.setState({ showingSaved: false });
      }
    });
  }

  render() {
    const { loading, showingSaved, profiles } = this.state;
    if (loading) {
      return <LoadingCircle progress={-1} wide />;
    }

    if (showingSaved) {
      return (
        <RememberedProfiles profiles={profiles} showForm={this.showForm} />
      );
    } else {
      return <LoginForm showSaved={this.showSaved} />;
    }
  }

  showForm = () => {
    this.setState({ showingSaved: false });
  };
  showSaved = () => {
    this.setState({ showingSaved: true });
  };
}

interface IProps {}

const actionCreators = actionCreatorsList();

type IDerivedProps = Dispatchers<typeof actionCreators>;

interface IState {
  loading: boolean;
  showingSaved: boolean;
  profiles: Profile[];
}

export default connect<IProps>(LoginScreen, { actionCreators });
