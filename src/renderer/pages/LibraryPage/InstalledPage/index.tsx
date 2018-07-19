import { messages } from "common/butlerd";
import { Space } from "common/helpers/space";
import { Dispatch } from "common/types";
import React from "react";
import { hook } from "renderer/hocs/hook";
import { withSpace } from "renderer/hocs/withSpace";
import GameSeries from "renderer/pages/common/GameSeries";
import SearchControl from "renderer/pages/common/SearchControl";
import {
  FilterGroup,
  FilterOptionIcon,
  FilterOptionLink,
  SortsAndFilters,
} from "renderer/pages/common/SortsAndFilters";
import StandardMainAction from "renderer/pages/common/StandardMainAction";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import { T } from "renderer/t";

const InstalledSeries = GameSeries(messages.FetchCaves);

class InstalledPage extends React.PureComponent<Props> {
  render() {
    const { space } = this.props;

    return (
      <InstalledSeries
        label={["sidebar.installed"]}
        params={{ limit: 15, cursor: space.queryParam("cursor") }}
        getGame={cave => cave.game}
        getKey={cave => cave.id}
        renderItemExtras={cave => <StandardMainAction game={cave.game} />}
        renderMainFilters={() => <SearchControl />}
        renderExtraFilters={() => (
          <SortsAndFilters>
            <FilterGroup>
              <FilterOptionLink href="itch://locations">
                <FilterOptionIcon icon="cog" />
                {T(["install_locations.manage"])}
              </FilterOptionLink>
            </FilterGroup>
          </SortsAndFilters>
        )}
      />
    );
  }
}

interface Props extends MeatProps {
  space: Space;
  dispatch: Dispatch;
}

export default withSpace(hook()(InstalledPage));
