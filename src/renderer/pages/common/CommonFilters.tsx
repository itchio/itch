import { FilterGroup } from "renderer/pages/common/SortsAndFilters";
import { FilterOption } from "renderer/pages/common/Filter";
import { FilterDropdown } from "renderer/pages/common/FilterDropdown";
import { GameClassification } from "common/butlerd/messages";
import { _ } from "renderer/t";

export const FilterGroupGameClassification = () => {
  return (
    <>
      <FilterGroup>
        <FilterOption
          optionKey="classification"
          optionValue={GameClassification.Game}
          label={_("filter_by.games.classification.games")}
        />
        <FilterOption
          optionKey="classification"
          optionValue={GameClassification.Tool}
          label={_("filter_by.games.classification.tools")}
        />
        <FilterOption
          optionKey="classification"
          optionValue={GameClassification.Assets}
          label={_("filter_by.games.classification.assets")}
        />
        <FilterOption
          optionKey="classification"
          optionValue={GameClassification.Comic}
          label={_("filter_by.games.classification.comics")}
        />
        <FilterOption
          optionKey="classification"
          optionValue={GameClassification.Book}
          label={_("filter_by.games.classification.books")}
        />
        <FilterOption
          optionKey="classification"
          optionValue={GameClassification.PhysicalGame}
          label={_("filter_by.games.classification.physical_game")}
        />
      </FilterGroup>
    </>
  );
};

///////////////////////////////////////////////////

export const FilterGroupInstalled = () => {
  return (
    <>
      <FilterGroup>
        <FilterOption
          optionKey="installed"
          optionValue={"true"}
          label={_("filter_by.games.status.installed")}
        />
      </FilterGroup>
    </>
  );
};

///////////////////////////////////////////////////

export const FilterGroupPlatform = () => {
  return (
    <>
      <FilterGroup>
        <FilterDropdown
          optionKey="platform"
          allLabel={_("filter_by.games.platform.all")}
          options={[
            {
              value: "windows",
              label: _("filter_by.games.platform.windows"),
            },
            { value: "osx", label: _("filter_by.games.platform.osx") },
            { value: "linux", label: _("filter_by.games.platform.linux") },
            { value: "web", label: _("filter_by.games.platform.web") },
          ]}
        />
      </FilterGroup>
    </>
  );
};
