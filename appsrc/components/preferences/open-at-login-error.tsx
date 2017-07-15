
import {createStructuredSelector} from "reselect";
import * as React from "react";
import {connect} from "../connect";

import urls from "../../constants/urls";

import Icon from "../icon";

import {IState, IOpenAtLoginError} from "../../types";
import {ILocalizer} from "../../localizer";
import interleave, {IComponent} from "../interleave";

class OpenAtLoginError extends React.Component<IOpenAtLoginErrorProps> {
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

interface IOpenAtLoginErrorProps {
  t: ILocalizer;
  openAtLoginError: IOpenAtLoginError;
}

const mapStateToProps = createStructuredSelector({
  openAtLoginError: (state: IState) => state.status.openAtLoginError,
});

const mapDispatchToProps = () => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(OpenAtLoginError);
