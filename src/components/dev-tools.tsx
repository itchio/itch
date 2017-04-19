
import * as React from "react";
import {createDevTools} from "redux-devtools";

// Monitors are separate packages, and you can make a custom one
import FilterMonitor from "redux-devtools-filter-actions";
import LogMonitor from "redux-devtools-log-monitor";
import DockMonitor from "redux-devtools-dock-monitor";

// createDevTools takes a monitor and produces a DevTools component
const DevTools = createDevTools(
  <DockMonitor toggleVisibilityKey="alt-h" changePositionKey="alt-q" defaultIsVisible={false}>
    <FilterMonitor blacklist={["WINDOW_FOCUS_CHANGED"]}>
      <LogMonitor theme="tomorrow" expandActionRoot expandStateRoot={false}/>
    </FilterMonitor>
  </DockMonitor>,
);

export default DevTools;
