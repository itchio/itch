
import * as React from "react";
import {connect, I18nProps} from "./connect";

import * as ospath from "path";

import * as actions from "../actions";

import Games from "./games";
import GameFilters from "./game-filters";
import {map, filter} from "underscore";

import {ICaveRecordSet, IGameRecordSet, IInstallLocation, IDownloadKey} from "../types";
import {dispatcher} from "../constants/action-types";

export class Location extends React.Component<IProps & IDerivedProps & I18nProps, void> {
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
      <GameFilters tab={tab}>
        <span className="link" onClick={(e) => browseInstallLocation({name: locationName})}>
          {t("grid.item.show_local_files")}
        </span>
      </GameFilters>

      {locationGames.length > 0
        ? <Games games={locationGames} tab={tab}/>
        : <p className="empty">{t("install_location.empty")}</p>
      }
    </div>;
  }
}

interface IProps {
  locationName: string;
}

interface IDerivedProps {
  userDataPath: string;
  locations: {
    [key: string]: IInstallLocation;
  };
  caves: ICaveRecordSet;
  allGames: IGameRecordSet;
  downloadKeys: {
    [key: string]: IDownloadKey;
  };

  browseInstallLocation: typeof actions.browseInstallLocation;
}

export default connect<IProps>(Location, {
  state: (state): Partial<IDerivedProps> => ({
    caves: state.globalMarket.caves || {},
    allGames: state.market.games || {},
    locations: state.preferences.installLocations,
    userDataPath: state.system.userDataPath,
  }),
  dispatch: (dispatch): Partial<IDerivedProps> => ({
    browseInstallLocation: dispatcher(dispatch, actions.browseInstallLocation),
  }),
});
