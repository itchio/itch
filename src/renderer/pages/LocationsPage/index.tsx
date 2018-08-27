import { messages } from "common/butlerd";
import { fileSize } from "common/format/filesize";
import { Dispatch } from "common/types";
import React from "react";
import FiltersContainer from "renderer/basics/FiltersContainer";
import butlerCaller from "renderer/hocs/butlerCaller";
import { hook } from "renderer/hocs/hook";
import { dispatchTabPageUpdate } from "renderer/hocs/tab-utils";
import { withTab } from "renderer/hocs/withTab";
import GameStripe from "renderer/pages/common/GameStripe";
import ItemList from "renderer/pages/common/ItemList";
import Page from "renderer/pages/common/Page";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import { isEmpty, sortBy } from "underscore";

const ListInstallLocations = butlerCaller(messages.InstallLocationsList);
const LocationStripe = GameStripe(messages.FetchCaves);

class LocationsPage extends React.PureComponent<Props> {
  render() {
    return (
      <Page>
        <ListInstallLocations
          params={{ sequence: this.props.sequence }}
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

  componentDidMount() {
    dispatchTabPageUpdate(this.props, { label: ["install_locations.manage"] });
  }
}

interface Props extends MeatProps {
  dispatch: Dispatch;
  tab: string;
}

export default withTab(hook()(LocationsPage));
