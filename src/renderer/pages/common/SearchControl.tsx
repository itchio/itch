import { Dispatch, LocalizedString } from "common/types";
import { ambientTab } from "common/util/navigation";
import React from "react";
import { hookWithProps } from "renderer/hocs/hook";
import { dispatchTabEvolve, urlWithParams } from "renderer/hocs/tab-utils";
import { withTab } from "renderer/hocs/withTab";
import FilterInput from "renderer/pages/common/FilterInput";
import { TString } from "renderer/t";
import { debounce } from "common/util/rate-limit";
import { IntlShape } from "react-intl";
import { injectIntl } from "renderer/hocs/injectIntl";

class SearchControl extends React.PureComponent<Props, State> {
  override state: State = { value: this.props.search ?? "" };

  override componentDidUpdate(prevProps: Props) {
    // the page can change the search from outside (clicking a channel on
    // the builds page does this), cancel any pending debounced write so it
    // doesn't overwrite the new value
    if (
      prevProps.search !== this.props.search &&
      this.props.search !== this.state.value
    ) {
      this.setSearch.cancel();
      this.setState({ value: this.props.search ?? "" });
    }
  }

  override componentWillUnmount() {
    this.setSearch.cancel();
  }

  override render(): JSX.Element {
    const { intl, placeholder } = this.props;
    return (
      <FilterInput
        value={this.state.value}
        placeholder={TString(intl, placeholder ?? ["grid.criterion.filter"])}
        onChange={this.onSearchChange}
      />
    );
  }

  onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    this.setState({ value });
    this.setSearch(value);
  };

  setSearch = debounce((search: string) => {
    const { url } = this.props;
    if (!url) {
      // tab hasn't derived a location yet, nothing to evolve
      return;
    }
    dispatchTabEvolve(this.props, {
      replace: true,
      url: urlWithParams(url, { search }),
    });
  }, 250);
}

interface Props {
  tab: string;
  dispatch: Dispatch;
  intl: IntlShape;

  placeholder?: LocalizedString;

  url: string | undefined;
  search: string | undefined;
}

interface State {
  value: string;
}

export default withTab(
  injectIntl(
    hookWithProps(SearchControl)((map) => ({
      url: map((rs, props) => ambientTab(rs, props).location?.url),
      search: map((rs, props) => ambientTab(rs, props).location?.query.search),
    }))(SearchControl)
  )
);
