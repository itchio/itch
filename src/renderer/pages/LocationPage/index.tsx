import * as messages from "common/butlerd/messages";
import { ambientTab } from "common/util/navigation";
import React from "react";
import ErrorState from "renderer/basics/ErrorState";
import LoadingState from "renderer/basics/LoadingState";
import { dispatchTabPageUpdate } from "renderer/hocs/tab-utils";
import { useAppDispatch, useAppSelector } from "renderer/hooks/redux";
import { useButlerd } from "renderer/hooks/useButlerd";
import { useTab } from "renderer/hooks/useTab";
import Page from "renderer/pages/common/Page";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import LocationContents from "renderer/pages/LocationPage/LocationContents";

const FetchedLocation = ({ id }: { id: string }) => {
  const tab = useTab();
  const dispatch = useAppDispatch();

  const { loading, error, result } = useButlerd(
    messages.InstallLocationsGetByID,
    { id },
    {
      onResult: ({ installLocation }) => {
        if (installLocation) {
          dispatchTabPageUpdate(
            { tab, dispatch },
            { label: installLocation.path }
          );
        }
      },
    }
  );

  if (error) {
    return <ErrorState error={error} />;
  }
  if (loading && !result) {
    return <LoadingState />;
  }
  return <LocationContents location={result ? result.installLocation : null} />;
};

const LocationPage = (_props: MeatProps) => {
  const tab = useTab();
  const installLocationId = useAppSelector(
    (rs) => ambientTab(rs, { tab }).location?.firstPathElement
  );

  return (
    <Page>
      {installLocationId ? (
        <FetchedLocation key={installLocationId} id={installLocationId} />
      ) : (
        // no id in the URL: same terminal state as a failed lookup
        <LocationContents location={null} />
      )}
    </Page>
  );
};

export default LocationPage;
