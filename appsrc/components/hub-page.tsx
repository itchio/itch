
import * as React from "react";

import HubSidebar from "./hub-sidebar";
import HubSidebarHandle from "./hub-sidebar-handle";
import HubContent from "./hub-content";

export class HubPage extends React.Component<void, void> {
  render () {
    return <div className="hub-page">
      <HubSidebar/>
      <HubSidebarHandle/>
      <HubContent/>
    </div>;
  }
}

export default HubPage;
