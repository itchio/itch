
import * as React from "react";
import {connect} from "../connect";

import urls from "../../constants/urls";

import {ILocalizer} from "../../localizer";

import {IState} from "../../types";

class ProxySettings extends React.Component<IProxySettingsProps, void> {
  render () {
    const {t, proxy} = this.props;

    return <span className="proxy-settings">
      {t("preferences.proxy_server_address")}
      {proxy
        ? <span className="value">
          {proxy}
        </span>
        : <span className="value">
          {t("preferences.proxy_server_source.direct")}
        </span>
      }
      {" "}
      <a href={urls.proxyDocs}>
        {t("docs.learn_more")}
      </a>
    </span>;
  }
}

interface IProxySettingsProps {
  t: ILocalizer;
  proxy?: string;
}

const mapDispatchToProps = () => ({});
const mapStateToProps = (state: IState) => ({
  proxy: state.system.proxy,
});

interface IProxySettingsState {
  proxy?: string;
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ProxySettings);
