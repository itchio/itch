import { actions } from "common/actions";
import { messages } from "common/butlerd";
import { InstallLocationSummary } from "common/butlerd/messages";
import { Dispatch, MenuTemplate } from "common/types";
import { ambientWind, urlForInstallLocation } from "common/util/navigation";
import React from "react";
import Filler from "renderer/basics/Filler";
import IconButton from "renderer/basics/IconButton";
import { hook } from "renderer/hocs/hook";
import { makeGameStripe } from "renderer/pages/common/GameStripe";
import LocationSizeBar from "renderer/pages/LocationsPage/LocationSizeBar";
import { TitleBreak } from "renderer/pages/PageStyles/games";
import styled from "renderer/styles";
import { T, _ } from "renderer/t";
import { fileSize } from "common/format/filesize";

const LocationStripe = makeGameStripe(messages.FetchCaves);

const SizeTag = styled.div`
  margin-left: 1em;
  font-size: ${(props) => props.theme.fontSizes.baseText};
`;

class LocationSummary extends React.PureComponent<Props> {
  render() {
    const { location } = this.props;

    return (
      <LocationStripe
        title={`${location.path}`}
        renderTitleExtras={this.renderTitleExtras}
        params={{
          filters: {
            installLocationId: location.id,
          },
        }}
        href={`itch://locations/${location.id}`}
        getGame={this.getGame}
      />
    );
  }

  getGame = LocationStripe.getGameCallback((cave) => cave.game);
  renderTitleExtras = () => {
    const { location } = this.props;
    let installedSize: string;
    if (location && location.sizeInfo && location.sizeInfo.installedSize > 0) {
      installedSize = fileSize(location.sizeInfo.installedSize);
    }

    return (
      <>
        <SizeTag>
          {installedSize
            ? T(
                _("preferences.install_location.size_used_by_games", {
                  installedSize,
                })
              )
            : T(_("preferences.install_location.empty"))}
        </SizeTag>
        <Filler />
        <TitleBreak />
        <LocationSizeBar location={location} />
        <IconButton icon="more_vert" onClick={this.onMoreActions} />
      </>
    );
  };

  onMoreActions = (e: React.MouseEvent<any>) => {
    e.preventDefault();
    const { location, numLocations } = this.props;
    const mayDelete = numLocations > 1;

    let template: MenuTemplate = [];
    template.push({
      localizedLabel: ["preferences.install_location.navigate"],
      action: actions.navigate({
        wind: "root",
        url: urlForInstallLocation(location.id),
      }),
      id: "context--install-location-navigate",
    });

    if (mayDelete) {
      template.push({
        localizedLabel: ["preferences.install_location.delete"],
        action: actions.removeInstallLocation({ id: location.id }),
        id: "context--install-location-delete",
      });
    }

    const { dispatch } = this.props;
    dispatch(
      actions.popupContextMenu({
        wind: ambientWind(),
        clientX: e.clientX,
        clientY: e.clientY,
        template,
      })
    );
  };
}

interface Props {
  dispatch: Dispatch;

  location: InstallLocationSummary;
  numLocations: number;
}

export default hook()(LocationSummary);
