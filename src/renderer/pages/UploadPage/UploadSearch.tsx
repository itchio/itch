import { Dispatch } from "common/types";
import { ambientTab } from "common/util/navigation";
import React from "react";
import Icon from "renderer/basics/Icon";
import { hookWithProps } from "renderer/hocs/hook";
import { dispatchTabEvolve, urlWithParams } from "renderer/hocs/tab-utils";
import { withTab } from "renderer/hocs/withTab";
import styled from "renderer/styles";
import { TString } from "renderer/t";
import { debounce } from "underscore";
import { IntlShape, injectIntl } from "react-intl";

const Wrap = styled.div`
  position: relative;
  flex: 0 0 360px;
`;

const StyledIcon = styled(Icon)`
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: ${(props) => props.theme.secondaryText};
  pointer-events: none;
  font-size: 14px;
`;

const Input = styled.input`
  width: 100%;
  height: 36px;
  padding: 0 12px 0 32px;
  border: 1px solid ${(props) => props.theme.inputBorder};
  border-radius: 3px;
  background: ${(props) => props.theme.inputBackground};
  color: ${(props) => props.theme.baseText};
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.accent};
  }

  &::placeholder {
    color: ${(props) => props.theme.secondaryText};
  }
`;

interface Props {
  tab: string;
  dispatch: Dispatch;
  intl: IntlShape;
  url: string;
  search: string;
}

interface State {
  value: string;
}

class UploadSearch extends React.PureComponent<Props, State> {
  override state: State = { value: this.props.search ?? "" };

  override componentDidUpdate(prevProps: Props) {
    // Sync from the URL if it changed externally (e.g. clicking a row's
    // channel chip). Cancel any pending debounced write so an in-flight
    // keystroke doesn't clobber the new value.
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

  override render() {
    const { value } = this.state;
    return (
      <Wrap>
        <StyledIcon icon="search" />
        <Input
          type="search"
          value={value}
          placeholder={TString(this.props.intl, ["upload.search_placeholder"])}
          onChange={this.onChange}
        />
      </Wrap>
    );
  }

  onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.currentTarget.value;
    this.setState({ value: v });
    this.setSearch(v);
  };

  setSearch = debounce((search: string) => {
    const { url } = this.props;
    dispatchTabEvolve(this.props, {
      replace: true,
      url: urlWithParams(url, { search }),
    });
  }, 250);
}

export default withTab(
  injectIntl(
    hookWithProps(UploadSearch)((map) => ({
      url: map((rs, props) => ambientTab(rs, props).location.url),
      search: map(
        (rs, props) => ambientTab(rs, props).location.query.search ?? ""
      ),
    }))(UploadSearch)
  )
);
