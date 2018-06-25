import React from "react";
import Page from "renderer/pages/common/Page";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import FiltersContainer from "renderer/basics/FiltersContainer";
import butlerCaller from "renderer/hocs/butlerCaller";
import { messages } from "common/butlerd";
import { isEmpty } from "underscore";
import GameStripe from "renderer/pages/common/GameStripe";
import { fileSize } from "common/format/filesize";

const ListInstallLocations = butlerCaller(messages.InstallLocationsList);
const LocationStripe = GameStripe(messages.FetchCaves);

class LocationsPage extends React.PureComponent<Props> {
  render() {
    return (
      <Page>
        <ListInstallLocations
          params={{}}
          loadingHandled
          render={({ loading, result }) => (
            <>
              <FiltersContainer loading={loading} />
              {result && !isEmpty(result.installLocations)
                ? result.installLocations.map(il => (
                    <>
                      <LocationStripe
                        title={`${il.path} (${fileSize(
                          il.sizeInfo.installedSize
                        )})`}
                        params={{
                          filters: {
                            installLocationId: il.id,
                          },
                        }}
                        href={`itch://locations/${il.id}`}
                        map={result =>
                          result &&
                          result.items &&
                          result.items.map(x => x.game)
                        }
                      />
                    </>
                  ))
                : null}
            </>
          )}
        />
      </Page>
    );
  }
}

interface Props extends MeatProps {}

export default LocationsPage;
