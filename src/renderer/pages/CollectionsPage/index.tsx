import React from "react";
import styled, * as styles from "renderer/styles";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import { Dispatch } from "common/types";
import { withTab } from "renderer/hocs/withTab";
import { hookWithProps } from "renderer/hocs/hook";
import { ambientTab } from "common/util/navigation";
import { withProfile } from "renderer/hocs/withProfile";
import { Profile } from "common/butlerd/messages";
import makeCollectionSeries from "renderer/series/CollectionSeries";
import * as messages from "common/butlerd/messages";
import SearchControl from "renderer/pages/common/SearchControl";
import {
  SortsAndFilters,
  FilterGroup,
} from "renderer/pages/common/SortsAndFilters";
import MoreMenuButton from "renderer/pages/common/MoreMenuButton";
import { actions } from "common/actions";
import urls from "common/constants/urls";
import { SortOption } from "renderer/pages/common/Sort";
import { _ } from "renderer/t";
import modals from "renderer/modals";

const ProfileCollectionsSeries = makeCollectionSeries(
  messages.FetchProfileCollections
);

const CollectionsDiv = styled.div`
  ${styles.meat};
`;

class CollectionsPage extends React.PureComponent<Props> {
  override render() {
    const { profile, search, sortBy, sortDir } = this.props;
    return (
      <CollectionsDiv className="collections-page">
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
        <MoreMenuButton
          template={[
            {
              localizedLabel: ["collection.menu.new"],
              action: actions.openModal(
                modals.editCollection.make({
                  wind: "root",
                  title: ["collection.edit.new_title"],
                  message: "",
                  widgetParams: {},
                })
              ),
            },
            {
              localizedLabel: ["outlinks.manage_collections"],
              action: actions.openInExternalBrowser({
                url: urls.myCollections,
              }),
            },
          ]}
        />
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
}

interface Props extends MeatProps {
  tab: string;
  dispatch: Dispatch;
  profile: Profile;

  sortBy: string | undefined;
  sortDir: string | undefined;
  url: string | undefined;
  search: string | undefined;
}

const hooked = hookWithProps(CollectionsPage)((map) => ({
  url: map((rs, props) => ambientTab(rs, props).location?.url),
  sortBy: map((rs, props) => ambientTab(rs, props).location?.query.sortBy),
  sortDir: map((rs, props) => ambientTab(rs, props).location?.query.sortDir),
  search: map((rs, props) => ambientTab(rs, props).location?.query.search),
}))(CollectionsPage);
export default withTab(withProfile(hooked));
