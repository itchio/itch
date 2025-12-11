import urls from "common/constants/urls";
import React from "react";
import Icon from "renderer/basics/Icon";
import { useAppSelector } from "renderer/hooks/redux";
import { T } from "renderer/t";

const OpenAtLoginErrorMessage = () => {
  const openAtLoginError = useAppSelector((rs) => rs.status.openAtLoginError);

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
};

export default React.memo(OpenAtLoginErrorMessage);
