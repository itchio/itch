import React from "react";
import Page from "renderer/pages/common/Page";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import FiltersContainer from "renderer/basics/FiltersContainer";
import butlerCaller from "renderer/hocs/butlerCaller";
import { messages } from "common/butlerd";
import { isEmpty, sortBy, invert } from "underscore";
import GameStripe from "renderer/pages/common/GameStripe";
import { fileSize } from "common/format/filesize";
import ItemList from "renderer/pages/common/ItemList";

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
              {result && !isEmpty(result.installLocations) ? (
                <ItemList>
                  {sortBy(
                    result.installLocations,
                    il => -il.sizeInfo.installedSize
                  ).map(il => (
                    <>
                      <LocationStripe
                        title={`${il.path}`}
                        renderTitleExtras={() => (
                          <>
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
                              {fileSize(il.sizeInfo.installedSize)}
                            </div>
                          </>
                        )}
                        params={{
                          filters: {
                            installLocationId: il.id,
                          },
                        }}
                        href={`itch://locations/${il.id}`}
                        getGame={cave => cave.game}
                      />
                    </>
                  ))}
                </ItemList>
              ) : null}
            </>
          )}
        />
      </Page>
    );
  }
}

interface Props extends MeatProps {}

export default LocationsPage;
