import React from "react";
import { FilterGroup } from "renderer/pages/common/SortsAndFilters";
import { FilterOption } from "renderer/pages/common/Filter";
import { GameClassification } from "common/butlerd/messages";

export const FilterGroupGameClassification = () => {
  return (
    <>
      <FilterGroup>
        <FilterOption
          optionKey="classification"
          optionValue={GameClassification.Game}
          label={["filter_by.games.classification.games"]}
        />
        <FilterOption
          optionKey="classification"
          optionValue={GameClassification.Tool}
          label={["filter_by.games.classification.tools"]}
        />
        <FilterOption
          optionKey="classification"
          optionValue={GameClassification.Assets}
          label={["filter_by.games.classification.assets"]}
        />
        <FilterOption
          optionKey="classification"
          optionValue={GameClassification.Comic}
          label={["filter_by.games.classification.comics"]}
        />
        <FilterOption
          optionKey="classification"
          optionValue={GameClassification.Book}
          label={["filter_by.games.classification.books"]}
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
          label="Installed"
        />
      </FilterGroup>
    </>
  );
};
