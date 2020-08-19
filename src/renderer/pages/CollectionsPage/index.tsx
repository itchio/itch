import React from "react";
import styled, * as styles from "renderer/styles";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import { Dispatch } from "common/types";
import { withTab } from "renderer/hocs/withTab";
import { hookWithProps } from "renderer/hocs/hook";
import { ambientTab, ambientWind } from "common/util/navigation";
import { withProfile } from "renderer/hocs/withProfile";
import { Profile } from "common/butlerd/messages";
import makeCollectionSeries from "renderer/series/CollectionSeries";
import { messages } from "common/butlerd";
import SearchControl from "renderer/pages/common/SearchControl";
import {
  FilterSpacer,
  SortsAndFilters,
  FilterGroup,
} from "renderer/pages/common/SortsAndFilters";
import IconButton from "renderer/basics/IconButton";
import { actions } from "common/actions";
import urls from "common/constants/urls";
import { SortOption } from "renderer/pages/common/Sort";
import { _ } from "renderer/t";

const ProfileCollectionsSeries = makeCollectionSeries(
  messages.FetchProfileCollections
);

const CollectionsDiv = styled.div`
  ${styles.meat};
`;

class CollectionsPage extends React.PureComponent<Props> {
  render() {
    const { profile, search, sortBy, sortDir } = this.props;
    return (
      <CollectionsDiv>
        <ProfileCollectionsSeries
          label={_("sidebar.collections")}
          getRecord={this.getRecord}
          params={{
            profileId: profile.id,
            sortBy,
            reverse: sortDir === "reverse",
            search,
          }}
          renderMainFilters={this.renderMainFilters}
          renderExtraFilters={this.renderExtraFilters}
        />
      </CollectionsDiv>
    );
  }

  getRecord = ProfileCollectionsSeries.getRecordCallback((c) => c);

  renderMainFilters = () => {
    return (
      <>
        <SearchControl />
        <FilterSpacer />
        <IconButton icon="more_vert" onClick={this.onMore} />
      </>
    );
  };

  renderExtraFilters = () => {
    return (
      <SortsAndFilters>
        <FilterGroup>
          <SortOption sortBy={"title"} label={_("sort_by.collections.title")} />
          <SortOption
            sortBy={"updatedAt"}
            label={_("sort_by.collections.updated_at")}
          />
        </FilterGroup>
      </SortsAndFilters>
    );
  };

  onMore = (ev: React.MouseEvent<HTMLElement>) => {
    const { dispatch, tab, url } = this.props;
    const { clientX, clientY } = ev;
    dispatch(
      actions.popupContextMenu({
        wind: ambientWind(),
        clientX,
        clientY,
        template: [
          {
            localizedLabel: ["outlinks.manage_collections"],
            action: actions.navigate({
              wind: ambientWind(),
              url: urls.myCollections,
            }),
          },
        ],
      })
    );
  };
}

interface Props extends MeatProps {
  tab: string;
  dispatch: Dispatch;
  profile: Profile;

  sortBy: string;
  sortDir: string;
  url: string;
  search: string;
}

const hooked = hookWithProps(CollectionsPage)((map) => ({
  url: map((rs, props) => ambientTab(rs, props).location.url),
  sortBy: map((rs, props) => ambientTab(rs, props).location.query.sortBy),
  sortDir: map((rs, props) => ambientTab(rs, props).location.query.sortDir),
  search: map((rs, props) => ambientTab(rs, props).location.query.search),
}))(CollectionsPage);
export default withTab(withProfile(hooked));
