import React from "react";
import { fileSize } from "common/format/filesize";
import { makeGameStripe } from "renderer/pages/common/GameStripe";
import { messages } from "common/butlerd";
import { InstallLocationSummary } from "common/butlerd/messages";

const LocationStripe = makeGameStripe(messages.FetchCaves);

export default class LocationSummary extends React.PureComponent<Props> {
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

  getGame = LocationStripe.getGameCallback(cave => cave.game);
  renderTitleExtras = () => {
    const { location } = this.props;
    return (
      <div
        style={{
          marginLeft: ".5em",
          border: "1px solid #333",
          borderRadius: "4px",
          fontSize: "60%",
          padding: "4px",
          color: "white",
          fontWeight: "bold",
        }}
      >
        {fileSize(location.sizeInfo.installedSize)}
      </div>
    );
  };
}

interface Props {
  location: InstallLocationSummary;
}
