import React from "react";

import {
  actionCreatorsList,
  Dispatchers,
  connect,
} from "renderer/hocs/connect";

import { Profile } from "common/butlerd/messages";
import { messages, call } from "common/butlerd";

import { isEmpty } from "underscore";

import RememberedProfiles from "./RememberedProfiles/index";
import LoginForm from "./LoginForm";

import watching, { Watcher } from "renderer/hocs/watching";
import { actions } from "common/actions";
import LoadingCircle from "renderer/basics/LoadingCircle";
import { doAsync } from "renderer/helpers/doAsync";

@watching
class LoginScreen extends React.PureComponent<Props & DerivedProps, State> {
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

interface Props {}

const actionCreators = actionCreatorsList();

type DerivedProps = Dispatchers<typeof actionCreators>;

interface State {
  loading: boolean;
  showingSaved: boolean;
  profiles: Profile[];
}

export default connect<Props>(
  LoginScreen,
  { actionCreators }
);
