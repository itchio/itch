import classNames from "classnames";
import { actions } from "common/actions";
import * as messages from "common/butlerd/messages";
import { InstallLocationSummary } from "common/butlerd/messages";
import { ambientWind } from "common/util/navigation";
import React, { useEffect } from "react";
import ErrorState from "renderer/basics/ErrorState";
import FiltersContainer from "renderer/basics/FiltersContainer";
import { dispatchTabPageUpdate } from "renderer/hocs/tab-utils";
import { useAppDispatch, useAppSelector } from "renderer/hooks/redux";
import { useButlerd } from "renderer/hooks/useButlerd";
import { useTab } from "renderer/hooks/useTab";
import ItemList from "renderer/pages/common/ItemList";
import Page from "renderer/pages/common/Page";
import {
  FilterGroup,
  FilterOptionButton,
  FilterOptionIcon,
  FilterOptionLink,
  FilterSpacer,
  SortsAndFilters,
} from "renderer/pages/common/SortsAndFilters";
import LocationSummary from "renderer/pages/LocationsPage/LocationSummary";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import { T } from "renderer/t";
import LoadingCircle from "renderer/basics/LoadingCircle";
import styled from "renderer/styles";

const Spacer = styled.div`
  width: 8px;
`;

const LocationList = ({
  locations,
}: {
  locations: InstallLocationSummary[];
}) => (
  <ItemList>
    {[...locations]
      .sort(
        (a, b) =>
          (b.sizeInfo?.installedSize ?? 0) - (a.sizeInfo?.installedSize ?? 0)
      )
      .map((location) => (
        <LocationSummary
          key={location.id}
          location={location}
          numLocations={locations.length}
        />
      ))}
  </ItemList>
);

const LocationsPage = ({ sequence }: MeatProps) => {
  const tab = useTab();
  const dispatch = useAppDispatch();
  const locationScanProgress = useAppSelector(
    (rs) => rs.system.locationScanProgress
  );
  const scanningLocations = locationScanProgress !== null;

  useEffect(() => {
    dispatchTabPageUpdate(
      { tab, dispatch },
      { label: ["install_locations.manage"] }
    );
  }, [tab, dispatch]);

  const { loading, error, result } = useButlerd(
    messages.InstallLocationsList,
    {},
    { sequence }
  );

  if (error) {
    return (
      <Page>
        <ErrorState error={error} />
      </Page>
    );
  }

  const locations = result?.installLocations;

  return (
    <Page>
      <FiltersContainer loading={loading} />
      <SortsAndFilters>
        <FilterGroup>
          <FilterOptionLink
            href="itch://scan-install-locations"
            className={classNames({ disabled: scanningLocations })}
          >
            <FilterOptionIcon icon="search" />
            {T(["preferences.scan_install_locations"])}
            {scanningLocations && locationScanProgress != null ? (
              <>
                <Spacer />
                <LoadingCircle progress={locationScanProgress} />
              </>
            ) : null}
          </FilterOptionLink>
        </FilterGroup>
        <FilterSpacer />
        <FilterGroup>
          <FilterOptionButton
            onClick={() =>
              dispatch(actions.addInstallLocation({ wind: ambientWind() }))
            }
          >
            <FilterOptionIcon icon="plus" />
            {T(["preferences.install_location.add"])}
          </FilterOptionButton>
        </FilterGroup>
      </SortsAndFilters>
      {locations && locations.length > 0 ? (
        <LocationList locations={locations} />
      ) : null}
    </Page>
  );
};

export default LocationsPage;
