
import * as React from "react";
import {createStructuredSelector} from "reselect";
import {connect, I18nProps} from "../connect";

import urls from "../../constants/urls";

import Icon from "../basics/icon";

import {IAppState, IOpenAtLoginError} from "../../types";
import interleave, {IComponent} from "../interleave";

class OpenAtLoginError extends React.Component<IProps & IDerivedProps & I18nProps, void> {
  render () {
    const {t, openAtLoginError} = this.props;

    if (!openAtLoginError) {
      return null;
    }

    let cause: IComponent[];

    if (openAtLoginError.cause === "no_desktop_file") {
      cause = interleave(t, "preferences.behavior.open_at_login.causes.no_desktop_file", {
        linux_install_page: <a href={urls.installingOnLinux}>installing itch on Linux</a>,
      });
    } else if (openAtLoginError.cause === "error") {
      cause = [openAtLoginError.message];
    }

    if (cause) {
      return <p className="explanation drop-down" style={{marginBottom: "15px"}}>
        <Icon icon="warning"/>{" "}
        {interleave(t, "preferences.behavior.open_at_login.error", {
          cause: <span>{cause}</span>,
        })}
      </p>;
    }

    return null;
  }
}

interface IProps {}

interface IDerivedProps {
  openAtLoginError: IOpenAtLoginError;
}

export default connect<IProps>(OpenAtLoginError, {
  state: createStructuredSelector({
    openAtLoginError: (state: IAppState) => state.status.openAtLoginError,
  }),
});
