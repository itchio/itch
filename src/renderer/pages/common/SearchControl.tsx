import React from "react";
import { debounce } from "underscore";
import { withSpace } from "renderer/hocs/withSpace";
import { hook } from "renderer/hocs/hook";
import FilterInput from "renderer/pages/common/FilterInput";
import { Dispatch } from "common/types";
import { Space } from "common/helpers/space";
import { ambientWind } from "common/util/navigation";

class SearchControl extends React.PureComponent<Props> {
  render(): JSX.Element {
    return (
      <FilterInput
        placeholder="Filter..."
        onChange={e => this.setSearch(e.currentTarget.value)}
      />
    );
  }

  setSearch = debounce((search: string) => {
    const { dispatch, space } = this.props;
    dispatch(
      space.makeEvolve({
        wind: ambientWind(),
        replace: true,
        url: space.urlWithParams({ search }),
      })
    );
  }, 250);
}

interface Props {
  space: Space;
  dispatch: Dispatch;
}

export default withSpace(hook()(SearchControl));
