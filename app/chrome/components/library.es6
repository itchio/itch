
import * as React from "react";
var classNames = require("classnames");

import {UserPanel} from "./user_panel";
import {GameList} from "./game_list";

var remote = window.require("remote");
var AppActions = remote.require("./metal/actions/app_actions");

// Hack for frameless styling
var frameless = remote.require("process").platform == "darwin"

function* entries(obj) {
  for (let key of Object.keys(obj)) {
    yield [key, obj[key]];
  }
}

/**
 * The main state of the client - displaying the library
 */
class LibraryPage extends React.Component {
  render() {
    return <div className="library_page">
      <LibrarySidebar {...this.props}/>
      <LibraryContent {...this.props}/>
    </div>;
  }
}

/**
 * 
 */
class LibrarySidebar extends React.Component {
  render() {
    let panel = this.props.panel;
    let collections = [];
    for (let [id, collection] of entries(this.props.collections || {})) {
      let props = {
        name: `collections/${id}`,
        label: collection.title,
        panel
      };
      collections.push(<LibraryPanelLink {...props}/>);
    }

    let installs = [];
    for (let [id, install] of entries(this.props.installs || {})) {
      let icon = this.state_to_icon(install.state);
      let props = {
        name: `installs/${id}`,
        label: install.game.title,
        error: (install.state == 'ERROR' ? install.error : null),
        progress: install.progress,
        icon
      };
      installs.push(<LibraryPanelLink {...props}/>);
    }

    return <div className={classNames("sidebar", {frameless})}>
      <UserPanel {...this.props}/>
      <div className="panel_links">
        <h3>Tabs</h3>

        <LibraryPanelLink name="owned" label="Owned" panel={panel}/>
        <LibraryPanelLink name="dashboard" label="Dashboard" panel={panel}/>

        <h3>Collections</h3>

        {collections}

        <h3>Installs</h3>

        {installs}
      </div>
    </div>;
  }

  // Non-React methods
  state_to_icon(state) {
    let icon = '';
    switch (state) {
      case 'ERROR':
        icon = 'error';
        break;
      case 'PENDING':
      case 'SEARCHING_UPLOAD':
        icon = 'stopwatch';
        break;
      case 'DOWNLOADING':
        icon = 'download';
        break;
      case 'EXTRACTING':
        icon = 'file-zip';
        break;
      case 'CONFIGURING':
        icon = 'settings';
        break;
      case 'RUNNING':
        icon = 'gamepad';
        break;
      case 'IDLE':
        icon = 'checkmark';
        break;
    }
    return icon;
  }
}

class LibraryContent extends React.Component {
  render() {
    return <div className="main_content">
      <GameList games={this.props.games}/>
    </div>;
  }
}

class LibraryPanelLink extends React.Component {
  render() {
    var {name, panel, label, progress, icon, error} = this.props;
    var current = name == panel;

    var _progress = progress ? ` (${(progress * 100).toFixed()}%)` : '';
    var _label = `${label}${_progress}`

    return <div className={classNames("panel_link", {current})} onClick={() => { AppActions.focus_panel(this.props.name); }}>
      {icon ?
        <span className={`icon icon-${icon}`}/>
      :''}

      {_label}

      {progress ?
        <div className="progress_outer">
          <div className="progress_inner" style={{width: `${progress * 100}%`}}/>
        </div>
      :''}

      {error ?
        <div className="panel_link_error">{error}</div>
      :''}
    </div>;
  }
}

export {LibraryPage};

