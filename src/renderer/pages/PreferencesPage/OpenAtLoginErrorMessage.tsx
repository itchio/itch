import urls from "common/constants/urls";
import { OpenAtLoginError } from "common/types";
import React from "react";
import Icon from "renderer/basics/Icon";
import { hook } from "renderer/hocs/hook";
import { T } from "renderer/t";

class OpenAtLoginErrorMessage extends React.PureComponent<Props> {
  render() {
    const { openAtLoginError } = this.props;

    if (!openAtLoginError) {
      return null;
    }

    let cause: JSX.Element | string;

    if (openAtLoginError.cause === "no_desktop_file") {
      cause = T([
        "preferences.behavior.open_at_login.causes.no_desktop_file",
        {
          linux_install_page: (
            <a href={urls.installingOnLinux}>installing itch on Linux</a>
          ),
        },
      ]);
    } else if (openAtLoginError.cause === "error") {
      cause = openAtLoginError.message;
    }

    if (cause) {
      return (
        <p className="explanation drop-down" style={{ marginBottom: "15px" }}>
          <Icon icon="warning" />{" "}
          {T([
            "preferences.behavior.open_at_login.error",
            {
              cause: <span>{cause}</span>,
            },
          ])}
        </p>
      );
    }

    return null;
  }
}

interface Props {
  openAtLoginError: OpenAtLoginError;
}

export default hook((map) => ({
  openAtLoginError: map((rs) => rs.status.openAtLoginError),
}))(OpenAtLoginErrorMessage);
