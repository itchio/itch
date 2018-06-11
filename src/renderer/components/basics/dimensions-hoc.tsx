import React from "react";

import { throttle } from "underscore";
import getDisplayName from "./get-display-name";

interface IDimensionsState {
  width: number;
  height: number;
  scrollTop: number;
}

export interface DimensionsProps {
  width: number;
  height: number;
  scrollTop: number;
  divRef: (el: HTMLElement) => void;
}

declare class ResizeObserver {
  constructor(cb: () => void);
  observe(el: HTMLElement): void;
  disconnect(): void;
}

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;
type Subtract<T, K> = Omit<T, keyof K>;

function withDimensions<P extends DimensionsProps>(
  Component: React.ComponentType<P>
): React.ComponentType<Subtract<P, DimensionsProps>> {
  return class extends React.PureComponent<
    Subtract<P, DimensionsProps>,
    IDimensionsState
  > {
    static displayName = `Dimensions(${getDisplayName(Component)})`;
    ro: ResizeObserver | null = null;
    onScroll: any;

    constructor(props: Subtract<P, DimensionsProps>, context: any) {
      super(props, context);
      this.state = { width: 0, height: 0, scrollTop: 0 };
    }

    gotDivRef = (el: HTMLElement) => {
      if (!el) {
        return;
      }

      if (!this.ro) {
        this.ro = new ResizeObserver(() => {
          this.setState({
            width: el.clientWidth,
            height: el.clientHeight,
          });
        });
        this.ro.observe(el);
      }

      if (!this.onScroll) {
        this.onScroll = el.addEventListener(
          "scroll",
          throttle(
            () => {
              this.setState({
                scrollTop: el.scrollTop,
              });
            },
            45,
            { leading: false }
          )
        );
      }
    };

    componentWillUnmount() {
      if (this.ro) {
        this.ro.disconnect();
        this.ro = null;
      }

      this.onScroll = null;
    }

    render() {
      const restProps = this.props;
      const { width, height, scrollTop } = this.state;

      return (
        <Component
          width={width}
          height={height}
          scrollTop={scrollTop}
          divRef={this.gotDivRef}
          {...restProps}
        />
      );
    }
  };
}

export default withDimensions;
