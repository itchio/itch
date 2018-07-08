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
          label="Games"
        />
        <FilterOption
          optionKey="classification"
          optionValue={GameClassification.Tool}
          label="Tools"
        />
        <FilterOption
          optionKey="classification"
          optionValue={GameClassification.Assets}
          label="Game assets"
        />
        <FilterOption
          optionKey="classification"
          optionValue={GameClassification.Comic}
          label="Comic"
        />
        <FilterOption
          optionKey="classification"
          optionValue={GameClassification.Book}
          label="Book"
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
