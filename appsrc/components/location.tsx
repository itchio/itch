
import * as React from "react";
import {connect} from "./connect";
import {createStructuredSelector} from "reselect";

import * as ospath from "path";

import * as actions from "../actions";

import Games from "./games";
import GameGridFilters from "./game-grid-filters";
import {map, filter} from "underscore";

import {IState, ICaveRecordSet, IGameRecordSet, IInstallLocation, IDownloadKey} from "../types";
import {IAction, dispatcher} from "../constants/action-types";
import {ILocalizer} from "../localizer";

export class Location extends React.Component<ILocationProps, void> {
  render () {
    const {t, locationName, userDataPath, locations, caves, allGames, browseInstallLocation} = this.props;

    const isAppData = (locationName === "appdata");
    let location = locations[locationName];
    if (!location) {
      if (locationName === "appdata") {
        location = {
          path: ospath.join(userDataPath, "apps"),
        };
      }
    }

    const locCaves = filter(caves, (cave) => {
      return cave.installLocation === locationName ||
             (isAppData && !cave.installLocation);
    });
    const locationGames = filter(map(locCaves, (key) => allGames[key.gameId]), (x) => !!x);
    const tab = `location/${locationName}`;

    return <div className="location-meat">
      <GameGridFilters tab={tab}>
        <span className="link" onClick={(e) => browseInstallLocation({name: locationName})}>
          {t("grid.item.show_local_files")}
        </span>
      </GameGridFilters>

      {locationGames.length > 0
        ? <Games games={locationGames} tab={tab}/>
        : <p className="empty">{t("install_location.empty")}</p>
      }
    </div>;
  }
}

interface ILocationProps {
  // specified
  locationName: string;

  // derived
  userDataPath: string;
  locations: {
    [key: string]: IInstallLocation;
  };
  caves: ICaveRecordSet;
  allGames: IGameRecordSet;
  downloadKeys: {
    [key: string]: IDownloadKey;
  };

  t: ILocalizer;

  browseInstallLocation: typeof actions.browseInstallLocation;
}

const mapStateToProps = createStructuredSelector({
  caves: (state: IState) => state.globalMarket.caves || {},
  allGames: (state: IState) => state.market.games || {},
  locations: (state: IState) => state.preferences.installLocations,
  userDataPath: (state: IState) => state.system.userDataPath,
});

const mapDispatchToProps = (dispatch: (action: IAction<any>) => void) => ({
  browseInstallLocation: dispatcher(dispatch, actions.browseInstallLocation),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Location);
